import { seedPearls } from "./seed";
import type {
  Pearl,
  PearlDraft,
  PearlFilters,
  PearlId,
  ProfessorMessage,
} from "./types";

const STORAGE_KEY = "permanence.pearls.v1";
const POSITIONS_KEY = "permanence.pearl-positions.v1";

const isBrowser = () => typeof window !== "undefined";

export type PearlPosition = { x: number; y: number };

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
      sourceType: "other",
      encounterDate: new Date().toISOString().slice(0, 10),
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
    return seedPearls;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    savePearls(seedPearls);
    return seedPearls;
  }

  try {
    const pearls = JSON.parse(stored) as Pearl[];

    if (!Array.isArray(pearls)) {
      return seedPearls;
    }

    const reconciledPearls = reconcileSeedPearls(pearls);
    savePearls(reconciledPearls);
    return reconciledPearls;
  } catch {
    return seedPearls;
  }
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
  const nextPearls = [pearl, ...pearls];
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
      ? {
          ...pearl,
          ...draft,
          updatedAt: new Date().toISOString(),
        }
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
    const matchesType =
      !filters.sourceType ||
      filters.sourceType === "all" ||
      pearl.envelope.sourceType === filters.sourceType;

    const matchesTag =
      !tag ||
      pearl.envelope.tags.some((pearlTag) => pearlTag.toLowerCase() === tag);

    const searchableText = [
      pearl.envelope.title,
      pearl.envelope.source,
      pearl.envelope.mood,
      pearl.envelope.tags.join(" "),
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
    new Set(pearls.flatMap((pearl) => pearl.envelope.tags)),
  ).sort((a, b) => a.localeCompare(b));
}

function reconcileSeedPearls(pearls: Pearl[]) {
  const storedIds = new Set(pearls.map((pearl) => pearl.id));
  const missingSeedPearls = seedPearls.filter((pearl) => !storedIds.has(pearl.id));

  return [
    ...pearls.map((pearl) =>
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
