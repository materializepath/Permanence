import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { askHermes } from "@/lib/hermes/client";
import { readPearlsFromDisk } from "@/lib/pearls/file-store";
import type { Pearl, ProfessorMessage } from "@/lib/pearls/types";

export const runtime = "nodejs";

type ProfessorChatRequest = {
  pearlId?: string;
  question?: string;
  transcript?: ProfessorMessage[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProfessorChatRequest;
    const question = body.question?.trim();

    if (!body.pearlId || !question) {
      return NextResponse.json(
        { error: "Expected pearlId and question." },
        { status: 400 },
      );
    }

    const pearls = await readPearlsFromDisk();
    const pearl = pearls.find((candidate) => candidate.id === body.pearlId);

    if (!pearl) {
      return NextResponse.json(
        { error: "Could not find the requested Pearl." },
        { status: 404 },
      );
    }

    const content = await askHermes({
      prompt: buildProfessorPrompt(pearl, question, body.transcript ?? []),
    });
    const message: ProfessorMessage = {
      id: `professor-${randomUUID()}`,
      role: "professor",
      content,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

function buildProfessorPrompt(
  pearl: Pearl,
  question: string,
  transcript: ProfessorMessage[],
) {
  const recentTranscript = transcript.slice(-8).map(formatTranscriptMessage);

  return [
    "You are the Professor, a dedicated Hermes agent embedded in Permanence.",
    "Permanence is a local-first personal creative memory system for preserving first-person cultural encounters as Pearls.",
    "Your role is to help the user go deeper into the selected encounter: provide context, challenge interpretations, ask sharpening questions, and surface useful connections.",
    "Do not act as a general assistant. Do not claim to have changed the Pearl database or dashboard. The app will save your reply into the Professor Transcript.",
    "Answer in a thoughtful but compact way. Return only the Professor's message.",
    "",
    "Selected Pearl:",
    `Title: ${pearl.envelope.title || "Untitled Pearl"}`,
    `Source: ${pearl.envelope.source || "Unknown"}`,
    `Source type: ${pearl.envelope.sourceType}`,
    `Encounter date: ${pearl.envelope.encounterDate || "Unknown"}`,
    `Tags: ${(pearl.envelope.tags ?? []).join(", ") || "None"}`,
    `Mood: ${pearl.envelope.mood || "Not noted"}`,
    "",
    "Experiential Record:",
    truncate(pearl.experientialRecord || "Not written yet.", 4_000),
    "",
    "Intellectual Synthesis:",
    truncate(pearl.intellectualSynthesis || "Not written yet.", 4_000),
    "",
    "Recent Professor Transcript:",
    recentTranscript.length ? recentTranscript.join("\n") : "No prior exchanges.",
    "",
    "User question:",
    question,
  ].join("\n");
}

function formatTranscriptMessage(message: ProfessorMessage) {
  return `${message.role}: ${truncate(message.content, 900)}`;
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown Professor error.";
}
