import type { Pearl, ProfessorMessage } from "@/lib/pearls/types";

export type ProfessorAdapter = {
  ask(input: {
    pearl: Pearl;
    question: string;
  }): Promise<ProfessorMessage>;
};

export const professorAdapter: ProfessorAdapter = {
  async ask({ pearl, question }) {
    const response = await fetch("/api/professor/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pearlId: pearl.id,
        question,
        transcript: pearl.professorTranscript,
      }),
    });

    const body = (await response.json()) as {
      message?: ProfessorMessage;
      error?: string;
    };

    if (!response.ok || !body.message) {
      throw new Error(body.error ?? "The Professor could not answer.");
    }

    return body.message;
  },
};
