import { createId } from "@/lib/pearls/store";
import type { Pearl, PearlEnvelope, ProfessorMessage } from "@/lib/pearls/types";

export type ProfessorAdapter = {
  ask(input: {
    pearl: Pick<Pearl, "envelope" | "experientialRecord" | "intellectualSynthesis">;
    question: string;
  }): Promise<ProfessorMessage>;
};

function buildContextualResponse(envelope: PearlEnvelope, question: string) {
  const tags = envelope.tags.length ? envelope.tags.join(", ") : "untagged";

  return `Mock Professor response: using "${envelope.title || "this encounter"}" as context, I would start by looking at ${tags}. Your question, "${question}", points toward a useful synthesis move: separate what happened in the encounter from what the encounter is teaching you about your own practice.`;
}

export const mockProfessorAdapter: ProfessorAdapter = {
  async ask({ pearl, question }) {
    return {
      id: createId("professor"),
      role: "professor",
      content: buildContextualResponse(pearl.envelope, question),
      createdAt: new Date().toISOString(),
    };
  },
};
