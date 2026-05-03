import type { Pearl, ThreadingRequest, ThreadingResult } from "@/lib/pearls/types";

export type SearchAdapter = {
  thread(request: ThreadingRequest, pearls: Pearl[]): Promise<ThreadingResult>;
};

export const searchAdapter: SearchAdapter = {
  async thread({ prompt }) {
    const response = await fetch("/api/thread", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const body = (await response.json()) as {
      result?: ThreadingResult;
      error?: string;
    };

    if (!response.ok || !body.result) {
      throw new Error(body.error ?? "The Professor could not thread this prompt.");
    }

    return body.result;
  },
};
