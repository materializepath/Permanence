"use client";

import { useMemo, useState } from "react";
import {
  SacredButton,
  SacredEmpty,
  SacredMessage,
  SacredMessageLog,
  SacredOneLineLoader,
  getRandomSacredLoaderIndex,
} from "@/components/sacred/Sacred";
import { searchAdapter } from "@/lib/search/adapter";
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
  const [isThreading, setIsThreading] = useState(false);
  const [loaderIndex, setLoaderIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const pearlLookup = useMemo(
    () => new Map(pearls.map((pearl) => [pearl.id, pearl])),
    [pearls],
  );

  async function threadPrompt() {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return;
    }

    setIsThreading(true);
    setLoaderIndex(getRandomSacredLoaderIndex());
    setErrorMessage("");

    try {
      setResult(await searchAdapter.thread({ prompt: trimmedPrompt }, pearls));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The Professor could not generate a briefing.",
      );
    } finally {
      setIsThreading(false);
    }
  }

  return (
    <section className="threading-shell">
      <textarea
        className="sacred-input"
        onChange={(event) => setPrompt(event.currentTarget.value)}
        value={prompt}
      />
      <SacredButton
        disabled={isThreading || !prompt.trim()}
        onClick={threadPrompt}
        tone="primary"
        type="button"
      >
        {isThreading ? <SacredOneLineLoader index={loaderIndex} /> : "Generate briefing"}
      </SacredButton>
      {errorMessage ? (
        <p className="mvp-layer-text">Threading unavailable: {errorMessage}</p>
      ) : null}
      {result && (
        <div className="threading-result">
          <SacredMessageLog>
            <SacredMessage label="Hermes">
              {result.briefing}
            </SacredMessage>
          </SacredMessageLog>
          <div className="threading-result__pearls">
            {result.pearlIds.map((id) => {
              const pearl = pearlLookup.get(id);

              if (!pearl) {
                return null;
              }

              return (
                <button
                  className="mvp-connection-row"
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
      {!result ? (
        <SacredEmpty title="No briefing generated.">
          Generate a read-only Professor briefing from your Pearl library.
        </SacredEmpty>
      ) : null}
    </section>
  );
}
