import type { Pearl, PearlDraft } from "@/lib/pearls/types";
import { createPearl, createId } from "@/lib/pearls/store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") || "";
  const title = searchParams.get("title") || "";
  const source = searchParams.get("source") || url;

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter. Usage: /api/ingest/bookmark?url=...&title=..." },
      { status: 400 }
    );
  }

  const draft: PearlDraft = {
    envelope: {
      title: title || url,
      source: source,
      author: "",
      date: new Date().toISOString().split("T")[0],
      location: "",
      thumbnailUrl: searchParams.get("thumbnail") || "",
      sourceType: "website",
      sourceUrl: url,
      tags: [],
      mood: "",
    },
    experientialRecord: "",
    intellectualSynthesis: "",
    professorTranscript: [],
    connections: [],
    attachments: [],
  };

  const result = createPearl(draft);
  const pearl: Pearl = result.pearl;

  const bookmarkUrl = new URL("/", request.url);
  bookmarkUrl.port = "3007";

  return NextResponse.redirect(
    `${bookmarkUrl.toString()}?ingest=${encodeURIComponent(pearl.id)}`,
    302
  );
}
