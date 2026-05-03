"use client";

import { useState } from "react";
import {
  SacredButton,
  SacredEmpty,
  SacredMessage,
  SacredMessageViewer,
  SacredMessageLog,
  SacredOneLineLoader,
  getRandomSacredLoaderIndex,
} from "@/components/sacred/Sacred";
import { professorAdapter } from "@/lib/professor/adapter";
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
  const [loaderIndex, setLoaderIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  async function askProfessor() {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    setIsThinking(true);
    setLoaderIndex(getRandomSacredLoaderIndex());
    setErrorMessage("");
    const userMessage: ProfessorMessage = {
      id: createId("user"),
      role: "user",
      content: trimmedQuestion,
      createdAt: new Date().toISOString(),
    };

    try {
      const professorMessage = await professorAdapter.ask({
        pearl,
        question: trimmedQuestion,
      });

      onTranscriptChange([
        ...pearl.professorTranscript,
        userMessage,
        professorMessage,
      ]);
      setQuestion("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The Professor could not answer.",
      );
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <aside className="professor-shell">
      <SacredMessageLog
        empty={
          <SacredEmpty title="No saved exchanges.">
            Ask about context, references, or possible connections.
          </SacredEmpty>
        }
      >
        {pearl.professorTranscript.map((message) => (
          message.role === "user" ? (
            <SacredMessageViewer key={message.id} label="You">
              {message.content}
            </SacredMessageViewer>
          ) : (
            <SacredMessage key={message.id} label="Hermes">
              {message.content}
            </SacredMessage>
          )
        ))}
      </SacredMessageLog>

      <form
        className="professor-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void askProfessor();
        }}
      >
        <input
          className="sacred-input professor-composer__input"
          onChange={(event) => setQuestion(event.currentTarget.value)}
          placeholder="Message Hermes"
          value={question}
        />
        <SacredButton
          disabled={isThinking || !question.trim()}
          tone="primary"
          type="submit"
        >
          {isThinking ? (
            <SacredOneLineLoader index={loaderIndex} />
          ) : (
            "Send"
          )}
        </SacredButton>
        {errorMessage ? (
          <p className="mvp-layer-text">Professor unavailable: {errorMessage}</p>
        ) : null}
      </form>
    </aside>
  );
}
