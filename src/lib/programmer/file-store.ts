import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type UserConfigValue = string | number | boolean | null;
export type UserConfig = Record<string, UserConfigValue>;

export type ProgrammerFiles = {
  userOverridesCss: string;
  userConfig: UserConfig;
};

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const USER_OVERRIDES_PATH = path.join(PUBLIC_DIR, "user-overrides.css");
const USER_CONFIG_PATH = path.join(ROOT_DIR, "user-config.json");

export const DEFAULT_USER_OVERRIDES_CSS =
  "/* Hermes Programmer user overrides. Loaded last after app styles. */\n";

export const DEFAULT_USER_CONFIG: UserConfig = {
  interfaceTone: "sacred-minimal",
  programmerPanelDefaultOpen: true,
  professorPanelDefaultOpen: true,
  pearlCardDensity: "standard",
  themeToggleEnabled: false,
  themeToggleShortcut: null,
  themeToggleDisplay: "text",
  colorModeDefault: "light",
};

export async function ensureProgrammerFiles(): Promise<ProgrammerFiles> {
  await mkdir(PUBLIC_DIR, { recursive: true });

  const userOverridesCss = await readTextOrCreate(
    USER_OVERRIDES_PATH,
    DEFAULT_USER_OVERRIDES_CSS,
  );
  const userConfigText = await readTextOrCreate(
    USER_CONFIG_PATH,
    `${JSON.stringify(DEFAULT_USER_CONFIG, null, 2)}\n`,
  );

  return {
    userOverridesCss,
    userConfig: parseUserConfig(userConfigText),
  };
}

function parseUserConfig(value: string): UserConfig {
  const parsed = JSON.parse(value) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("user-config.json must contain a flat JSON object.");
  }

  const config: UserConfig = {};

  for (const [key, entry] of Object.entries(parsed)) {
    if (!isUserConfigValue(entry)) {
      throw new Error(`user-config.json value for "${key}" must be flat.`);
    }

    config[key] = entry;
  }

  return config;
}

async function readTextOrCreate(filePath: string, defaultValue: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }

    await writeFile(filePath, defaultValue, "utf8");
    return defaultValue;
  }
}

function isUserConfigValue(value: unknown): value is UserConfigValue {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function isMissingFileError(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}
