import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const HERMES_ENV_PATH = path.join(homedir(), ".hermes", ".env");
const DEFAULT_MODEL = "moonshotai/kimi-k2.6";

export type HermesEnv = {
  apiKey: string;
  model: string;
};

let cachedEnv: Promise<HermesEnv> | null = null;

export function loadHermesEnv() {
  if (!cachedEnv) {
    cachedEnv = readHermesEnv();
  }

  return cachedEnv;
}

async function readHermesEnv(): Promise<HermesEnv> {
  const fileEnv = await tryReadEnvFile(HERMES_ENV_PATH);

  const apiKey =
    process.env.OPENROUTER_API_KEY ?? fileEnv.OPENROUTER_API_KEY ?? "";
  const model =
    process.env.OPENROUTER_MODEL ??
    fileEnv.OPENROUTER_MODEL ??
    fileEnv.OPENROUTER_DEFAULT_MODEL ??
    DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Set it in process env or in ~/.hermes/.env.",
    );
  }

  return { apiKey, model };
}

async function tryReadEnvFile(filePath: string): Promise<Record<string, string>> {
  try {
    const text = await readFile(filePath, "utf8");
    return parseEnvFile(text);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

function parseEnvFile(text: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}
