import { NextResponse } from "next/server";
import { askHermes } from "@/lib/hermes/client";
import { readPearlsFromDisk } from "@/lib/pearls/file-store";
import type { Pearl, ThreadingResult } from "@/lib/pearls/types";

export const runtime = "nodejs";

type ThreadRequest = {
  prompt?: string;
};

type ScoredPearl = {
  pearl: Pearl;
  score: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ThreadRequest;
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json(
        { error: "Expected a threading prompt." },
        { status: 400 },
      );
    }

    const pearls = await readPearlsFromDisk();
    const selectedPearls = selectRelevantPearls(prompt, pearls);
    const briefing = selectedPearls.length
      ? await askHermes({
          prompt: buildThreadingPrompt(prompt, selectedPearls),
          maxTurns: 10,
        })
      : "Add Pearls to the library before threading a project prompt.";
    const result: ThreadingResult = {
      prompt,
      briefing,
      pearlIds: selectedPearls.map((pearl) => pearl.id),
    };

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

function selectRelevantPearls(prompt: string, pearls: Pearl[]) {
  if (!pearls.length) {
    return [];
  }

  const terms = tokenize(prompt);
  const scoredPearls = pearls
    .map((pearl): ScoredPearl => {
      const searchableText = pearlToSearchableText(pearl);

      return {
        pearl,
        score: terms.reduce(
          (score, term) => score + (searchableText.includes(term) ? 1 : 0),
          0,
        ),
      };
    })
    .sort((a, b) => b.score - a.score);
  const matches = scoredPearls
    .filter(({ score }) => score > 0)
    .slice(0, 5)
    .map(({ pearl }) => pearl);

  return matches.length ? matches : pearls.slice(0, 5);
}

function buildThreadingPrompt(prompt: string, pearls: Pearl[]) {
  return [
    "You are the Professor inside Permanence, a personal creative memory system.",
    "The user is asking for a read-only threading briefing across their Pearl library.",
    "Use only the Pearl excerpts provided here plus your public cultural knowledge. Do not claim to update tags, connections, synthesis, or the dashboard.",
    "Write a compact briefing that names the strongest relevant Pearls, explains the connective tissue, and gives the user a few useful synthesis moves for their project.",
    "",
    "Threading prompt:",
    prompt,
    "",
    "Relevant Pearl excerpts:",
    pearls.map(formatPearlExcerpt).join("\n\n"),
  ].join("\n");
}

function formatPearlExcerpt(pearl: Pearl, index: number) {
  return [
    `Pearl ${index + 1}: ${pearl.envelope.title || "Untitled Pearl"}`,
    `Source type: ${pearl.envelope.sourceType}`,
    `Tags: ${(pearl.envelope.tags ?? []).join(", ") || "None"}`,
    `Mood: ${pearl.envelope.mood || "Not noted"}`,
    `Experiential record: ${truncate(pearl.experientialRecord || "Not written yet.", 1_200)}`,
    `Intellectual synthesis: ${truncate(pearl.intellectualSynthesis || "Not written yet.", 1_600)}`,
  ].join("\n");
}

function pearlToSearchableText(pearl: Pearl) {
  return [
    pearl.envelope.title,
    pearl.envelope.source,
    (pearl.envelope.tags ?? []).join(" "),
    pearl.envelope.mood,
    pearl.experientialRecord,
    pearl.intellectualSynthesis,
    pearl.professorTranscript.map((message) => message.content).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/\W+/)
    .filter((term) => term.length > 3);
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown threading error.";
}
