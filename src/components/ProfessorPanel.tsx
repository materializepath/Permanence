"use client";

import { useState } from "react";
import { mockProfessorAdapter } from "@/lib/professor/adapter";
import { createId } from "@/lib/pearls/store";
import type { Pearl, ProfessorMessage } from "@/lib/pearls/types";

type ProfessorPanelProps = {
  pearl: Pearl;
  onTranscriptChange: (messages: ProfessorMessage[]) => void;
};

export function ProfessorPanel({
  pearl,
  onTranscriptChange,
}: ProfessorPanelProps) {
  const [question, setQuestion] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  async function askProfessor() {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    setIsThinking(true);
    const userMessage: ProfessorMessage = {
      id: createId("user"),
      role: "user",
      content: trimmedQuestion,
      createdAt: new Date().toISOString(),
    };
    const professorMessage = await mockProfessorAdapter.ask({
      pearl,
      question: trimmedQuestion,
    });

    onTranscriptChange([
      ...pearl.professorTranscript,
      userMessage,
      professorMessage,
    ]);
    setQuestion("");
    setIsThinking(false);
  }

  return (
    <aside className="rounded-[2rem] border border-stone-200 bg-stone-950 p-5 text-stone-50">
      <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
        Professor
      </p>
      <h3 className="mt-2 text-2xl font-semibold">Mock dialogue session</h3>
      <p className="mt-3 text-sm leading-6 text-stone-300">
        This panel preserves the workflow while the real Hermes/OpenRouter
        integration is still an adapter.
      </p>

      <div className="mt-5 max-h-80 space-y-3 overflow-auto pr-1">
        {pearl.professorTranscript.map((message) => (
          <div
            className={`rounded-2xl p-3 ${
              message.role === "user" ? "bg-stone-800" : "bg-stone-100 text-stone-950"
            }`}
            key={message.id}
          >
            <p className="text-[0.65rem] uppercase tracking-[0.2em] opacity-60">
              {message.role}
            </p>
            <p className="mt-2 text-sm leading-6">{message.content}</p>
          </div>
        ))}
        {!pearl.professorTranscript.length && (
          <p className="rounded-2xl bg-stone-900 p-4 text-sm text-stone-400">
            Ask about context, references, or possible connections.
          </p>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <textarea
          className="min-h-28 w-full rounded-2xl border border-stone-700 bg-stone-900 p-3 text-sm text-white outline-none transition placeholder:text-stone-500 focus:border-stone-400"
          onChange={(event) => setQuestion(event.currentTarget.value)}
          placeholder="What should the Professor help you think through?"
          value={question}
        />
        <button
          className="w-full rounded-full bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isThinking || !question.trim()}
          onClick={askProfessor}
          type="button"
        >
          {isThinking ? "Thinking..." : "Ask and save to transcript"}
        </button>
      </div>
    </aside>
  );
}
