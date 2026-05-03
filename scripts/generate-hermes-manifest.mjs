#!/usr/bin/env node
/**
 * Generates a compact manifest of the Permanence codebase that the
 * Programmer route ships in every OpenRouter prompt.
 *
 * Output: `.hermes-manifest.md` at the repo root.
 *
 * Heuristics are intentionally lightweight: a single descriptive line per
 * file, total cap ~100 lines, frequency-prioritized via git log when over
 * budget.
 */

import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");
const MANIFEST_PATH = path.join(ROOT_DIR, ".hermes-manifest.md");
const MAX_LINES = 100;

const SCAN_ROOTS = [
  "src",
  "public",
  "scripts",
  "docs",
  ".cursor/rules",
];
const ROOT_FILES = [
  "user-config.json",
  "package.json",
  "next.config.ts",
  "tsconfig.json",
  "permanence-pitch.md",
  "README.md",
];
const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  ".data",
  ".git",
  "dist",
  "build",
]);
const EXCLUDED_FILE_PATTERNS = [
  /\.test\.[tj]sx?$/,
  /\.spec\.[tj]sx?$/,
  /\.tsbuildinfo$/,
  /\.DS_Store$/,
];
const RELEVANT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".css",
  ".json",
  ".md",
  ".mjs",
  ".cjs",
  ".js",
  ".mdc",
]);

async function main() {
  const files = await collectFiles();
  const entries = [];

  for (const relativePath of files) {
    const absolutePath = path.join(ROOT_DIR, relativePath);

    try {
      const text = await readFile(absolutePath, "utf8");
      const line = describeFile(relativePath, text);

      if (line) {
        entries.push({ path: relativePath, line });
      }
    } catch (error) {
      console.warn(`manifest: could not read ${relativePath}: ${error.message}`);
    }
  }

  const finalEntries = capByFrequency(entries, MAX_LINES);
  const manifest = renderManifest(finalEntries);

  await writeFile(MANIFEST_PATH, manifest, "utf8");
  console.log(`manifest: wrote ${path.relative(ROOT_DIR, MANIFEST_PATH)} (${finalEntries.length} entries)`);
}

async function collectFiles() {
  const collected = new Set();

  for (const rootFile of ROOT_FILES) {
    const absolute = path.join(ROOT_DIR, rootFile);

    if (existsSync(absolute) && isRelevantFile(rootFile)) {
      collected.add(rootFile);
    }
  }

  for (const root of SCAN_ROOTS) {
    const absolute = path.join(ROOT_DIR, root);

    if (!existsSync(absolute)) {
      continue;
    }

    await walk(absolute, collected);
  }

  return Array.from(collected).sort();
}

async function walk(directory, collected) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(ROOT_DIR, absolute);

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue;
      }

      await walk(absolute, collected);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!isRelevantFile(relative)) {
      continue;
    }

    const stats = statSync(absolute);

    if (stats.size > 256 * 1024) {
      continue;
    }

    collected.add(relative);
  }
}

function isRelevantFile(relativePath) {
  if (EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(relativePath))) {
    return false;
  }

  return RELEVANT_EXTENSIONS.has(path.extname(relativePath));
}

function describeFile(relativePath, text) {
  const ext = path.extname(relativePath);

  if (ext === ".tsx" || (ext === ".ts" && /^src\/components\//.test(relativePath))) {
    return describeComponent(relativePath, text);
  }

  if (ext === ".ts") {
    return describeTypescript(relativePath, text);
  }

  if (ext === ".css") {
    return describeCss(relativePath, text);
  }

  if (ext === ".json") {
    return describeJson(relativePath, text);
  }

  if (ext === ".md" || ext === ".mdc") {
    return describeMarkdown(relativePath, text);
  }

  if (ext === ".mjs" || ext === ".cjs" || ext === ".js") {
    return describeScript(relativePath, text);
  }

  return null;
}

function describeComponent(relativePath, text) {
  const componentName = extractComponentName(text) ?? path.basename(relativePath, path.extname(relativePath));
  const classNames = extractTokens(text, /className\s*=\s*"([^"]+)"/g, 6);
  const cssVars = extractTokens(text, /var\((--[a-z0-9-]+)\)/gi, 6);
  const summary = guessComponentSummary(text);

  const parts = [`${componentName}: ${summary}`];

  if (classNames.length) {
    parts.push(`classes: ${classNames.join(", ")}`);
  }

  if (cssVars.length) {
    parts.push(`vars: ${cssVars.join(", ")}`);
  }

  return `- ${relativePath} — ${parts.join(" | ")}`;
}

function describeTypescript(relativePath, text) {
  const exports = extractExports(text);
  const summary = firstDocComment(text) ?? guessTypescriptSummary(relativePath);
  const exportList = exports.length ? `exports: ${exports.slice(0, 6).join(", ")}` : "";

  return `- ${relativePath} — ${summary}${exportList ? ` | ${exportList}` : ""}`;
}

function describeCss(relativePath, text) {
  const customProps = extractTokens(text, /(--[a-z0-9-]+)\s*:/gi, 12);
  const firstComment = (text.match(/\/\*\s*([^*][^*]*?)\s*\*\//) ?? [])[1]?.trim();
  const summary = firstComment ?? "global styles, theme variables, and component classes";

  const parts = [summary];

  if (customProps.length) {
    parts.push(`vars: ${customProps.slice(0, 8).join(", ")}`);
  }

  return `- ${relativePath} — ${parts.join(" | ")}`;
}

function describeJson(relativePath, text) {
  try {
    const parsed = JSON.parse(text);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const keys = Object.keys(parsed).slice(0, 8);
      return `- ${relativePath} — top-level keys: ${keys.join(", ")}`;
    }

    return `- ${relativePath} — JSON document`;
  } catch {
    return `- ${relativePath} — JSON document`;
  }
}

function describeMarkdown(relativePath, text) {
  const heading = (text.match(/^#\s+(.+)$/m) ?? [])[1]?.trim();
  const firstParagraph = (text.match(/^(?!#)([^\n][^\n]*)$/m) ?? [])[1]?.trim();
  const title = heading ?? path.basename(relativePath);
  const summary = firstParagraph ? truncate(firstParagraph, 140) : "documentation";

  return `- ${relativePath} — ${title}: ${summary}`;
}

function describeScript(relativePath, text) {
  const docComment = firstDocComment(text);
  return `- ${relativePath} — ${docComment ?? "build/dev script"}`;
}

function extractComponentName(text) {
  const namedDefault = text.match(/export\s+default\s+function\s+([A-Z][A-Za-z0-9_]*)/);
  if (namedDefault) {
    return namedDefault[1];
  }

  const namedExport = text.match(/export\s+function\s+([A-Z][A-Za-z0-9_]*)/);
  if (namedExport) {
    return namedExport[1];
  }

  const constExport = text.match(/export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*[:=]/);
  return constExport?.[1] ?? null;
}

function extractExports(text) {
  const names = new Set();
  const patterns = [
    /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g,
    /export\s+const\s+([A-Za-z0-9_]+)\s*[:=]/g,
    /export\s+type\s+([A-Za-z0-9_]+)/g,
    /export\s+class\s+([A-Za-z0-9_]+)/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      names.add(match[1]);
    }
  }

  return Array.from(names);
}

function extractTokens(text, pattern, limit) {
  const tokens = new Set();

  for (const match of text.matchAll(pattern)) {
    if (!match[1]) {
      continue;
    }

    for (const token of match[1].split(/\s+/)) {
      if (token) {
        tokens.add(token);
      }

      if (tokens.size >= limit) {
        return Array.from(tokens);
      }
    }
  }

  return Array.from(tokens);
}

function firstDocComment(text) {
  const blockComment = text.match(/\/\*\*?\s*([^*][^]*?)\s*\*\//);

  if (blockComment) {
    return truncate(
      blockComment[1]
        .split("\n")
        .map((line) => line.replace(/^\s*\*\s?/, "").trim())
        .filter(Boolean)
        .join(" "),
      160,
    );
  }

  const lineComment = text.match(/^\/\/\s*(.+)$/m);
  if (lineComment) {
    return truncate(lineComment[1].trim(), 160);
  }

  return null;
}

function guessComponentSummary(text) {
  if (/use client/.test(text) && /<form/i.test(text)) {
    return "client form/composer component";
  }

  if (/use client/.test(text)) {
    return "client component";
  }

  if (/createElement|<html|<body/.test(text)) {
    return "root layout";
  }

  return "react component";
}

function guessTypescriptSummary(relativePath) {
  if (/\/api\//.test(relativePath)) {
    return "Next.js API route";
  }

  if (/\/lib\//.test(relativePath)) {
    return "library module";
  }

  if (/types?\./.test(relativePath)) {
    return "type definitions";
  }

  return "module";
}

function capByFrequency(entries, max) {
  if (entries.length <= max) {
    return entries;
  }

  const counts = countCommitsPerFile(entries.map((entry) => entry.path));

  return entries
    .map((entry) => ({ entry, count: counts.get(entry.path) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.entry.path.localeCompare(b.entry.path))
    .slice(0, max)
    .map((row) => row.entry)
    .sort((a, b) => a.path.localeCompare(b.path));
}

function countCommitsPerFile(paths) {
  const counts = new Map();

  for (const filePath of paths) {
    try {
      const out = execFileSync(
        "git",
        ["log", "--pretty=format:%H", "--follow", "--", filePath],
        { cwd: ROOT_DIR, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      );
      counts.set(filePath, out.split("\n").filter(Boolean).length);
    } catch {
      counts.set(filePath, 0);
    }
  }

  return counts;
}

function renderManifest(entries) {
  const grouped = groupByTopLevel(entries);
  const sections = [
    "# Permanence Codebase Manifest",
    "",
    `_Generated ${new Date().toISOString()} by scripts/generate-hermes-manifest.mjs._`,
    "",
    "Use this manifest to navigate directly. Each line summarizes one file. Treat it as established background knowledge of the Permanence codebase.",
    "",
  ];

  for (const [group, lines] of grouped) {
    sections.push(`## ${group}`);
    sections.push("");
    sections.push(...lines);
    sections.push("");
  }

  return sections.join("\n");
}

function groupByTopLevel(entries) {
  const groups = new Map();

  for (const entry of entries) {
    const top = entry.path.split("/")[0];
    const label = topLevelLabel(top);

    if (!groups.has(label)) {
      groups.set(label, []);
    }

    groups.get(label).push(entry.line);
  }

  const order = ["src/app", "src/components", "src/lib", "public", "scripts", "docs", ".cursor", "Root"];

  return Array.from(groups.entries()).sort((a, b) => {
    return order.indexOf(a[0]) - order.indexOf(b[0]);
  });
}

function topLevelLabel(top) {
  if (top === "src") {
    return "src/app";
  }

  if (top === "public" || top === "scripts" || top === "docs" || top === ".cursor") {
    return top;
  }

  return "Root";
}

function truncate(value, maxLength) {
  if (!value) {
    return "";
  }

  return value.length <= maxLength ? value : `${value.slice(0, maxLength).trim()}...`;
}

main().catch((error) => {
  console.error("manifest: failed:", error);
  process.exitCode = 1;
});
