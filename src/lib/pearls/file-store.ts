import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizePearl, normalizePearls } from "@/lib/pearls/normalize";
import type { Pearl } from "@/lib/pearls/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const PEARLS_PATH = path.join(DATA_DIR, "pearls.json");
const TEMP_PEARLS_PATH = path.join(DATA_DIR, "pearls.json.tmp");

let writeQueue = Promise.resolve();

export async function readPearlsFromDisk(): Promise<Pearl[]> {
  await ensureDataDir();

  try {
    const file = await readFile(PEARLS_PATH, "utf8");
    const pearls = JSON.parse(file) as unknown;

    if (!isPearlArray(pearls)) {
      throw new Error("Pearl database does not contain an array.");
    }

    return normalizePearls(pearls);
  } catch (error) {
    if (isMissingFileError(error)) {
      await writePearlsToDisk([]);
      return [];
    }

    throw error;
  }
}

export async function writePearlsToDisk(pearls: Pearl[]): Promise<Pearl[]> {
  if (!isPearlArray(pearls)) {
    throw new Error("Pearl database writes must be arrays of Pearls.");
  }
  const normalizedPearls = normalizePearls(pearls);

  writeQueue = writeQueue
    .catch(() => undefined)
    .then(async () => {
      await ensureDataDir();
      await writeFile(
        TEMP_PEARLS_PATH,
        `${JSON.stringify(normalizedPearls, null, 2)}\n`,
        "utf8",
      );
      await rename(TEMP_PEARLS_PATH, PEARLS_PATH);
    });

  await writeQueue;
  return normalizedPearls;
}

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

function isPearlArray(value: unknown): value is Pearl[] {
  return Array.isArray(value) && value.every(isPearl);
}

function isPearl(value: unknown): value is Pearl {
  if (!value || typeof value !== "object") {
    return false;
  }

  const pearl = value as Partial<Pearl>;

  if (
    typeof pearl.id === "string" &&
    Boolean(pearl.envelope) &&
    Array.isArray(pearl.professorTranscript) &&
    Array.isArray(pearl.connections) &&
    Array.isArray(pearl.attachments) &&
    typeof pearl.createdAt === "string" &&
    typeof pearl.updatedAt === "string"
  ) {
    normalizePearl(pearl as Pearl);
    return true;
  }

  return false;
}

function isMissingFileError(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}
