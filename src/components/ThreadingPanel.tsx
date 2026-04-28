"use client";

import { useMemo, useState } from "react";
import { mockSearchAdapter } from "@/lib/search/adapter";
import type { Pearl, ThreadingResult } from "@/lib/pearls/types";

type ThreadingPanelProps = {
  pearls: Pearl[];
  onSelectPearl: (id: string) => void;
};

export function ThreadingPanel({ pearls, onSelectPearl }: ThreadingPanelProps) {
  const [prompt, setPrompt] = useState(
    "I am starting a project about anonymity and authorship.",
  );
  const [result, setResult] = useState<ThreadingResult | null>(null);

  const pearlLookup = useMemo(
    () => new Map(pearls.map((pearl) => [pearl.id, pearl])),
    [pearls],
  );

  async function threadPrompt() {
    setResult(await mockSearchAdapter.thread({ prompt }, pearls));
  }

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
        Threading
      </p>
      <h3 className="mt-2 text-2xl font-semibold">Project briefing mock</h3>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Describe a project or question. The placeholder adapter surfaces likely
        Pearls and shows where semantic retrieval will plug in.
      </p>
      <textarea
        className="input mt-4 min-h-28"
        onChange={(event) => setPrompt(event.currentTarget.value)}
        value={prompt}
      />
      <button
        className="mt-3 w-full rounded-full bg-stone-950 px-4 py-3 text-sm font-semibold text-white"
        onClick={threadPrompt}
        type="button"
      >
        Generate mock briefing
      </button>
      {result && (
        <div className="mt-5 rounded-2xl bg-stone-50 p-4">
          <p className="text-sm leading-6 text-stone-700">{result.briefing}</p>
          <div className="mt-4 space-y-2">
            {result.pearlIds.map((id) => {
              const pearl = pearlLookup.get(id);

              if (!pearl) {
                return null;
              }

              return (
                <button
                  className="block w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-left text-sm font-medium"
                  key={id}
                  onClick={() => onSelectPearl(id)}
                  type="button"
                >
                  {pearl.envelope.title}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
