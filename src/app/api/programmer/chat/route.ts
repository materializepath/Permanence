import { mkdir, readFile, rename, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { loadHermesEnv } from "@/lib/programmer/hermes-env";
import { PROGRAMMER_SYSTEM_PROMPT } from "@/lib/programmer/system-prompt";
import { readUserConfig } from "@/lib/user-config/server";
import type { UserConfig } from "@/lib/programmer/file-store";
import {
  findFirstProtectedPath,
  getProtectedPathReason,
  toAbsoluteWorkspacePath,
} from "@/lib/programmer/workspace-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MANIFEST_FILENAME = ".hermes-manifest.md";
const MAX_BUNDLE_BYTES = 200_000;
const MAX_FILE_BYTES = 64_000;

type ProgrammerChatRequest = {
  message?: string;
};

type ProgrammerChatResponse = {
  ok: boolean;
  summary: string;
  changedFiles: string[];
  userOverridesCssChanged: boolean;
  userConfigChanged: boolean;
  userConfig?: UserConfig;
  error?: string;
};

export async function POST(request: Request) {
  let body: ProgrammerChatRequest;

  try {
    body = (await request.json()) as ProgrammerChatRequest;
  } catch {
    return errorResponse("Expected a JSON body with a Programmer message.", 400);
  }

  const message = body.message?.trim();

  if (!message) {
    return errorResponse("Expected a Programmer message.", 400);
  }

  try {
    const env = await loadHermesEnv();
    const manifest = await loadManifest();
    const sourceBundle = await readNonProtectedSourceTree(manifest);

    const completion = await openRouterChat({
      apiKey: env.apiKey,
      model: env.model,
      messages: [
        { role: "system", content: PROGRAMMER_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt({ manifest, sourceBundle, message }),
        },
      ],
    });

    const parsed = parseCompletion(completion);

    if (!parsed) {
      return errorResponse(
        "The model returned a response that could not be parsed as JSON.",
        502,
      );
    }

    const fileEntries = Object.entries(parsed.files);
    const blocked = findFirstProtectedPath(fileEntries.map(([key]) => key));

    if (blocked) {
      return errorResponse(
        `Cannot edit ${blocked.path} — ${blocked.reason}`,
        409,
      );
    }

    const changedFiles: string[] = [];

    for (const [relativePath, content] of fileEntries) {
      const reason = getProtectedPathReason(relativePath);

      if (reason) {
        return errorResponse(
          `Cannot edit ${relativePath} — ${reason}`,
          409,
        );
      }

      if (typeof content !== "string") {
        return errorResponse(
          `Edit for ${relativePath} was not a string.`,
          502,
        );
      }

      await atomicWriteFile(toAbsoluteWorkspacePath(relativePath), content);
      changedFiles.push(relativePath);
    }

    const userConfigChanged = changedFiles.includes("user-config.json");
    const response: ProgrammerChatResponse = {
      ok: true,
      summary: parsed.summary || summarizeFallback(changedFiles),
      changedFiles,
      userOverridesCssChanged: changedFiles.includes("public/user-overrides.css"),
      userConfigChanged,
      userConfig: userConfigChanged ? await readUserConfig() : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    return errorResponse(getErrorMessage(error), 500);
  }
}

async function loadManifest() {
  try {
    return await readFile(toAbsoluteWorkspacePath(MANIFEST_FILENAME), "utf8");
  } catch {
    return "(manifest unavailable; run `npm run manifest` to generate it.)";
  }
}

async function readNonProtectedSourceTree(manifest: string) {
  const paths = extractManifestPaths(manifest).filter(
    (candidate) => !getProtectedPathReason(candidate),
  );

  const blocks: string[] = [];
  let totalBytes = 0;

  for (const relativePath of paths) {
    const absolute = toAbsoluteWorkspacePath(relativePath);

    try {
      const stats = await stat(absolute);

      if (!stats.isFile() || stats.size > MAX_FILE_BYTES) {
        continue;
      }
    } catch {
      continue;
    }

    let text: string;

    try {
      text = await readFile(absolute, "utf8");
    } catch {
      continue;
    }

    const block = `=== ${relativePath} ===\n${text}\n`;

    if (totalBytes + block.length > MAX_BUNDLE_BYTES) {
      break;
    }

    blocks.push(block);
    totalBytes += block.length;
  }

  return blocks.join("\n");
}

function extractManifestPaths(manifest: string) {
  const paths = new Set<string>();

  for (const line of manifest.split("\n")) {
    const match = line.match(/^-\s+([^\s—]+)\s—/);

    if (match) {
      paths.add(match[1]);
    }
  }

  return Array.from(paths);
}

function buildUserPrompt({
  manifest,
  sourceBundle,
  message,
}: {
  manifest: string;
  sourceBundle: string;
  message: string;
}) {
  return [
    "Codebase manifest:",
    "```",
    manifest.trim(),
    "```",
    "",
    "Current source files:",
    "```",
    sourceBundle.trim() || "(no readable source files)",
    "```",
    "",
    "User request:",
    message,
    "",
    'Respond with a single JSON object: {"summary": "...", "files": {"<path>": "<full new contents>"}}.',
    "Include ONLY files that need to change.",
  ].join("\n");
}

type ParsedCompletion = {
  summary: string;
  files: Record<string, string>;
};

function parseCompletion(raw: string): ParsedCompletion | null {
  const stripped = stripJsonFence(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const candidate = parsed as Record<string, unknown>;
  const filesValue = candidate.files;

  if (!filesValue || typeof filesValue !== "object" || Array.isArray(filesValue)) {
    return null;
  }

  const files: Record<string, string> = {};

  for (const [key, value] of Object.entries(filesValue as Record<string, unknown>)) {
    if (typeof value === "string") {
      files[key] = value;
    }
  }

  const summary =
    typeof candidate.summary === "string" ? candidate.summary.trim() : "";

  return { summary, files };
}

async function openRouterChat({
  apiKey,
  model,
  messages,
}: {
  apiKey: string;
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
}) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://permanence.local",
      "X-Title": "Permanence Programmer",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `OpenRouter request failed (${response.status}): ${truncate(text, 600)}`,
    );
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = json.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content) {
    throw new Error("OpenRouter returned an empty completion.");
  }

  return content;
}

function stripJsonFence(text: string) {
  const trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    const withoutOpening = trimmed.replace(/^```[a-zA-Z]*\n?/, "");
    const withoutClosing = withoutOpening.replace(/\n?```\s*$/, "");
    return withoutClosing.trim();
  }

  return trimmed;
}

async function atomicWriteFile(absolutePath: string, content: string) {
  await mkdir(path.dirname(absolutePath), { recursive: true });

  const tempPath = `${absolutePath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tempPath, content, "utf8");
  await rename(tempPath, absolutePath);
}

function summarizeFallback(changedFiles: string[]) {
  if (changedFiles.length === 0) {
    return "No changes were needed.";
  }

  if (changedFiles.length === 1) {
    return `Updated ${changedFiles[0]}.`;
  }

  return `Updated ${changedFiles.length} files: ${changedFiles.join(", ")}.`;
}

function truncate(value: string, maxLength: number) {
  if (!value) {
    return "";
  }

  return value.length <= maxLength ? value : `${value.slice(0, maxLength).trim()}...`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown Programmer error.";
}

function errorResponse(message: string, status: number) {
  const payload: ProgrammerChatResponse = {
    ok: false,
    summary: "",
    changedFiles: [],
    userOverridesCssChanged: false,
    userConfigChanged: false,
    error: message,
  };

  return NextResponse.json(payload, { status });
}
