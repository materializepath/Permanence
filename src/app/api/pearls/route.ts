import { NextResponse } from "next/server";
import {
  readPearlsFromDisk,
  writePearlsToDisk,
} from "@/lib/pearls/file-store";
import type { Pearl } from "@/lib/pearls/types";

export async function GET() {
  try {
    const pearls = await readPearlsFromDisk();
    return NextResponse.json({ pearls });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { pearls?: Pearl[] };

    if (!Array.isArray(body.pearls)) {
      return NextResponse.json(
        { error: "Expected request body to include a pearls array." },
        { status: 400 },
      );
    }

    const pearls = await writePearlsToDisk(body.pearls);
    return NextResponse.json({ pearls });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown Pearl storage error.";
}
