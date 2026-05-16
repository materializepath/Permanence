"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPearl, emptyPearlDraft } from "@/lib/pearls/store";

function BookmarkHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const url = searchParams.get("url") || "";
    const title = searchParams.get("title") || "";
    const source = searchParams.get("source") || url;

    if (!url) {
      router.replace("/");
      return;
    }

    const draft = emptyPearlDraft();
    draft.envelope.title = title || url;
    draft.envelope.source = source;
    draft.envelope.sourceType = "website";
    draft.envelope.sourceUrl = url;
    draft.envelope.date = new Date().toISOString().split("T")[0];

    const result = createPearl(draft);

    const hashPosition = hashStringToPosition(result.pearl.id);
    window.dispatchEvent(
      new CustomEvent("pearl-ingested", {
        detail: {
          pearlId: result.pearl.id,
          position: hashPosition,
        },
      })
    );

    sessionStorage.setItem("permanence.ingest-pearl", result.pearl.id);
    router.replace("/");
  }, [searchParams, router]);

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        height: "100vh",
        fontFamily: "monospace",
        textTransform: "uppercase",
      }}
    >
      <p>Ingesting...</p>
    </div>
  );
}

export default function BookmarkPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "grid",
            placeItems: "center",
            height: "100vh",
            fontFamily: "monospace",
            textTransform: "uppercase",
          }}
        >
          <p>Loading...</p>
        </div>
      }
    >
      <BookmarkHandler />
    </Suspense>
  );
}

function hashStringToPosition(id: string): { x: number; y: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const angle = Math.abs(hash) % 360 * (Math.PI / 180);
  const radius = 210 + (Math.abs(hash >> 3) % 80);
  return {
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius),
  };
}
