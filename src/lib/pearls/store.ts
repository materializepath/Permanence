import { seedPearls } from "./seed";
import { normalizePearl, normalizePearls } from "./normalize";
import type {
  Pearl,
  PearlDraft,
  PearlFilters,
  PearlId,
  ProfessorMessage,
} from "./types";

const STORAGE_KEY = "permanence.pearls.v1";
const POSITIONS_KEY = "permanence.pearl-positions.v1";
const REMOVED_PEARL_IDS = new Set<PearlId>(["anonymous-webcomic-archive"]);

const isBrowser = () => typeof window !== "undefined";

export type PearlPosition = { x: number; y: number };

export function loadStoredPearls(): Pearl[] | undefined {
  if (!isBrowser()) {
    return undefined;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return undefined;
  }

  try {
    const pearls = JSON.parse(stored) as Pearl[];

    if (!Array.isArray(pearls)) {
      return undefined;
    }

    return normalizePearls(pearls);
  } catch {
    return undefined;
  }
}

export function loadPearlPositions(): Record<PearlId, PearlPosition> {
  if (!isBrowser()) {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(POSITIONS_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<PearlId, PearlPosition>;

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

export function savePearlPosition(id: PearlId, position: PearlPosition) {
  if (!isBrowser()) {
    return;
  }

  const all = loadPearlPositions();
  all[id] = { x: position.x, y: position.y };
  window.localStorage.setItem(POSITIONS_KEY, JSON.stringify(all));
}

export function createId(prefix = "pearl") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function emptyPearlDraft(): PearlDraft {
  return {
    envelope: {
      title: "",
      source: "",
      author: "",
      date: "",
      location: "",
      thumbnailUrl: "",
      sourceType: "other",
      encounterDate: "",
      tags: [],
      mood: "",
    },
    experientialRecord: "",
    intellectualSynthesis: "",
    professorTranscript: [],
    connections: [],
    attachments: [],
  };
}

export function loadPearls(): Pearl[] {
  if (!isBrowser()) {
    return normalizePearls(seedPearls);
  }

  const storedPearls = loadStoredPearls();

  if (!storedPearls) {
    const normalizedSeedPearls = normalizePearls(seedPearls);
    savePearls(normalizedSeedPearls);
    return normalizedSeedPearls;
  }

  const reconciledPearls = reconcileSeedPearls(storedPearls);
  savePearls(reconciledPearls);
  return reconciledPearls;
}

export function savePearls(pearls: Pearl[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pearls));
}

export function createPearl(draft: PearlDraft, pearls = loadPearls()) {
  const now = new Date().toISOString();
  const pearl: Pearl = {
    ...draft,
    id: createId(),
    createdAt: now,
    updatedAt: now,
  };
  const nextPearls = [normalizePearl(pearl), ...pearls];
  savePearls(nextPearls);
  return { pearl, pearls: nextPearls };
}

export function updatePearl(
  id: PearlId,
  draft: PearlDraft,
  pearls = loadPearls(),
) {
  const nextPearls = pearls.map((pearl) =>
    pearl.id === id
      ? normalizePearl({
          ...pearl,
          ...draft,
          updatedAt: new Date().toISOString(),
        })
      : pearl,
  );

  savePearls(nextPearls);
  return nextPearls.find((pearl) => pearl.id === id);
}

export function deletePearl(id: PearlId, pearls = loadPearls()) {
  const nextPearls = pearls
    .filter((pearl) => pearl.id !== id)
    .map((pearl) => ({
      ...pearl,
      connections: pearl.connections.filter(
        (connection) => connection.targetPearlId !== id,
      ),
    }));

  savePearls(nextPearls);
  return nextPearls;
}

export function addProfessorMessage(
  id: PearlId,
  message: ProfessorMessage,
  pearls = loadPearls(),
) {
  const nextPearls = pearls.map((pearl) =>
    pearl.id === id
      ? {
          ...pearl,
          professorTranscript: [...pearl.professorTranscript, message],
          updatedAt: new Date().toISOString(),
        }
      : pearl,
  );

  savePearls(nextPearls);
  return nextPearls;
}

export function searchPearls(pearls: Pearl[], filters: PearlFilters) {
  const query = filters.query?.trim().toLowerCase();
  const tag = filters.tag?.trim().toLowerCase();

  return pearls.filter((pearl) => {
    const tags = pearl.envelope.tags ?? [];
    const matchesType =
      !filters.sourceType ||
      filters.sourceType === "all" ||
      pearl.envelope.sourceType === filters.sourceType;

    const matchesTag =
      !tag ||
      tags.some((pearlTag) => pearlTag.toLowerCase() === tag);

    const searchableText = [
      pearl.envelope.title,
      pearl.envelope.source,
      pearl.envelope.author,
      pearl.envelope.date,
      pearl.envelope.location,
      pearl.envelope.mood,
      tags.join(" "),
      pearl.experientialRecord,
      pearl.intellectualSynthesis,
      pearl.professorTranscript.map((message) => message.content).join(" "),
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = !query || searchableText.includes(query);

    return matchesType && matchesTag && matchesQuery;
  });
}

export function listTags(pearls: Pearl[]) {
  return Array.from(
    new Set(pearls.flatMap((pearl) => pearl.envelope.tags ?? [])),
  ).sort((a, b) => a.localeCompare(b));
}

function reconcileSeedPearls(pearls: Pearl[]) {
  const activePearls = normalizePearls(pearls)
    .filter((pearl) => !REMOVED_PEARL_IDS.has(pearl.id))
    .map((pearl) => ({
      ...pearl,
      connections: pearl.connections.filter(
        (connection) => !REMOVED_PEARL_IDS.has(connection.targetPearlId),
      ),
    }));
  const storedIds = new Set(activePearls.map((pearl) => pearl.id));
  const missingSeedPearls = normalizePearls(seedPearls).filter(
    (pearl) => !storedIds.has(pearl.id),
  );

  return [
    ...activePearls.map((pearl) =>
      pearl.id === "duchamp-moma-readymades" &&
      pearl.envelope.title === "Duchamp Readymades at MoMA"
        ? {
            ...pearl,
            envelope: {
              ...pearl.envelope,
              title: "Marcel Duchamp Exhibit",
            },
          }
        : pearl,
    ),
    ...missingSeedPearls,
  ];
}
