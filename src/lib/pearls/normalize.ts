import type { Pearl } from "@/lib/pearls/types";

export function normalizePearl(pearl: Pearl): Pearl {
  const envelope = pearl.envelope;
  const date = envelope.date || envelope.encounterDate || "";

  return {
    ...pearl,
    envelope: {
      ...envelope,
      title: envelope.title || "",
      source: envelope.source || "",
      author: envelope.author || "",
      date,
      location: envelope.location || "",
      thumbnailUrl: envelope.thumbnailUrl || "",
      sourceType: envelope.sourceType || "other",
      encounterDate: envelope.encounterDate || date,
      tags: Array.isArray(envelope.tags) ? envelope.tags : [],
      mood: envelope.mood || "",
    },
    experientialRecord: pearl.experientialRecord || "",
    intellectualSynthesis: pearl.intellectualSynthesis || "",
    professorTranscript: Array.isArray(pearl.professorTranscript)
      ? pearl.professorTranscript
      : [],
    connections: Array.isArray(pearl.connections) ? pearl.connections : [],
    attachments: Array.isArray(pearl.attachments) ? pearl.attachments : [],
  };
}

export function normalizePearls(pearls: Pearl[]) {
  return pearls.map(normalizePearl);
}
