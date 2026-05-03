import {
  loadPearls,
  loadStoredPearls,
  savePearls,
} from "@/lib/pearls/store";
import type { Pearl } from "@/lib/pearls/types";

const PEARLS_API_PATH = "/api/pearls";

export async function loadPersistedPearls(): Promise<Pearl[]> {
  const databasePearls = await fetchPearlsFromDatabase();
  const localPearls = loadStoredPearls();

  if (!localPearls) {
    savePearls(databasePearls);
    return databasePearls;
  }

  const mergedPearls = mergePearls(databasePearls, localPearls);

  if (!samePearls(databasePearls, mergedPearls)) {
    await savePearlsToDatabase(mergedPearls);
  }

  savePearls(mergedPearls);
  return mergedPearls;
}

export async function fetchPearlsFromDatabase(): Promise<Pearl[]> {
  const response = await fetch(PEARLS_API_PATH, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Could not load Pearls from the local database.");
  }

  const body = (await response.json()) as { pearls?: Pearl[] };

  if (!Array.isArray(body.pearls)) {
    throw new Error("The Pearl database returned an invalid response.");
  }

  return body.pearls;
}

export async function savePearlsToDatabase(pearls: Pearl[]): Promise<Pearl[]> {
  savePearls(pearls);

  const response = await fetch(PEARLS_API_PATH, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pearls }),
  });

  if (!response.ok) {
    throw new Error("Could not save Pearls to the local database.");
  }

  const body = (await response.json()) as { pearls?: Pearl[] };

  if (!Array.isArray(body.pearls)) {
    throw new Error("The Pearl database returned an invalid save response.");
  }

  savePearls(body.pearls);
  return body.pearls;
}

export function loadPearlsFromBrowserFallback() {
  return loadPearls();
}

function mergePearls(databasePearls: Pearl[], localPearls: Pearl[]) {
  const localIds = new Set(localPearls.map((pearl) => pearl.id));
  const databaseOnlyPearls = databasePearls.filter((pearl) => !localIds.has(pearl.id));

  return [...localPearls, ...databaseOnlyPearls];
}

function samePearls(a: Pearl[], b: Pearl[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}
