import type { Pearl, ThreadingRequest, ThreadingResult } from "@/lib/pearls/types";

export type SearchAdapter = {
  thread(request: ThreadingRequest, pearls: Pearl[]): Promise<ThreadingResult>;
};

export const mockSearchAdapter: SearchAdapter = {
  async thread({ prompt }, pearls) {
    const terms = prompt
      .toLowerCase()
      .split(/\W+/)
      .filter((term) => term.length > 3);

    const scoredPearls = pearls
      .map((pearl) => {
        const text = [
          pearl.envelope.title,
          pearl.envelope.tags.join(" "),
          pearl.envelope.mood,
          pearl.experientialRecord,
          pearl.intellectualSynthesis,
        ]
          .join(" ")
          .toLowerCase();

        return {
          pearl,
          score: terms.reduce(
            (score, term) => score + (text.includes(term) ? 1 : 0),
            0,
          ),
        };
      })
      .sort((a, b) => b.score - a.score);

    const selectedPearls = scoredPearls
      .filter(({ score }) => score > 0)
      .slice(0, 3)
      .map(({ pearl }) => pearl);

    const fallbackPearls = selectedPearls.length
      ? selectedPearls
      : pearls.slice(0, 3);

    return {
      prompt,
      pearlIds: fallbackPearls.map((pearl) => pearl.id),
      briefing:
        fallbackPearls.length > 0
          ? `Mock threading brief: this project prompt intersects most clearly with ${fallbackPearls
              .map((pearl) => pearl.envelope.title)
              .join(", ")}. A real semantic search layer would rank by embedded experiential and synthesis layers, then ask the Professor to produce a stronger briefing.`
          : "Add Pearls to the library before threading a project prompt.",
    };
  },
};
