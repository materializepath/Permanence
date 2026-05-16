"use client";

import { useEffect, useMemo, useState } from "react";
import { PermanenceShell } from "@/components/PermanenceShell";
import {
  loadPearlsFromBrowserFallback,
  loadPersistedPearls,
  savePearlsToDatabase,
} from "@/lib/pearls/client-persistence";
import {
  createPearl,
  deletePearl,
  emptyPearlDraft,
  searchPearls,
} from "@/lib/pearls/store";
import type {
  Pearl,
  PearlDraft,
  PearlFilters as PearlFiltersType,
  ProfessorMessage,
} from "@/lib/pearls/types";

type WorkspaceMode = "view" | "new" | "edit";

export default function Home() {
  const [pearls, setPearls] = useState<Pearl[]>([]);
  const [selectedPearlId, setSelectedPearlId] = useState<string | null>(null);
  const [mode, setMode] = useState<WorkspaceMode>("view");
  const [draft, setDraft] = useState<PearlDraft>(emptyPearlDraft);
  const [persistenceMessage, setPersistenceMessage] = useState("Loading local database...");
  const [filters, setFilters] = useState<PearlFiltersType>({
    query: "",
    sourceType: "all",
    tag: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function hydratePearls() {
      try {
        const nextPearls = await loadPersistedPearls();

        if (!isMounted) {
          return;
        }

        // Browser storage is still read once so existing Pearls migrate into the file database.
        setPearls(nextPearls);
        setPersistenceMessage("Saved to local database");
      } catch {
        if (!isMounted) {
          return;
        }

        setPearls(loadPearlsFromBrowserFallback());
        setPersistenceMessage("Using browser fallback; database unavailable");
      }
    }

    void hydratePearls();

    return () => {
      isMounted = false;
    };
  }, []);

  const visiblePearls = useMemo(
    () => searchPearls(pearls, filters),
    [filters, pearls],
  );
  const selectedPearl = pearls.find((pearl) => pearl.id === selectedPearlId);

  function selectPearl(id: string) {
    setSelectedPearlId(id);
    setMode("view");
  }

  function startNewPearl() {
    setDraft(emptyPearlDraft());
    setMode("new");
  }

  function startEditingPearl(pearl: Pearl) {
    setDraft(toDraft(pearl));
    setMode("edit");
  }

  function saveDraft() {
    if (mode === "new") {
      const result = createPearl(draft, pearls);
      setPearls(result.pearls);
      setSelectedPearlId(result.pearl.id);
      setMode("view");
      void persistPearls(result.pearls);
      return;
    }

    if (mode === "edit" && selectedPearl) {
      const nextPearls = pearls.map((pearl) =>
        pearl.id === selectedPearl.id
          ? {
              ...pearl,
              ...draft,
              updatedAt: new Date().toISOString(),
            }
          : pearl,
      );
      setPearls(nextPearls);
      setSelectedPearlId(selectedPearl.id);
      setMode("view");
      void persistPearls(nextPearls);
    }
  }

  function removeSelectedPearl() {
    if (!selectedPearl) {
      return;
    }

    const nextPearls = deletePearl(selectedPearl.id, pearls);
    setPearls(nextPearls);
    setSelectedPearlId(null);
    void persistPearls(nextPearls);
  }

  function updateTranscript(messages: ProfessorMessage[]) {
    if (!selectedPearl) {
      return;
    }

    const nextPearls = pearls.map((pearl) =>
      pearl.id === selectedPearl.id
        ? {
            ...pearl,
            professorTranscript: messages,
            updatedAt: new Date().toISOString(),
          }
        : pearl,
    );

    setPearls(nextPearls);
    void persistPearls(nextPearls);
  }

  function updatePearl(nextPearl: Pearl) {
    const nextPearls = pearls.map((pearl) =>
      pearl.id === nextPearl.id
        ? {
            ...nextPearl,
            updatedAt: new Date().toISOString(),
          }
        : pearl,
    );

    setPearls(nextPearls);
    setSelectedPearlId(nextPearl.id);
    void persistPearls(nextPearls);
  }

  async function persistPearls(nextPearls: Pearl[]) {
    setPersistenceMessage("Saving...");

    try {
      const savedPearls = await savePearlsToDatabase(nextPearls);
      setPearls(savedPearls);
      setPersistenceMessage("Saved to local database");
    } catch {
      setPersistenceMessage("Saved in browser fallback; database save failed");
    }
  }

  return (
    <PermanenceShell
      draft={draft}
      filters={filters}
      mode={mode}
      onCancelDraft={() => setMode("view")}
      onClosePearl={() => setSelectedPearlId(null)}
      onDeletePearl={removeSelectedPearl}
      onDraftChange={setDraft}
      onFiltersChange={setFilters}
      onSaveDraft={saveDraft}
      onSelectPearl={selectPearl}
      onStartEditingPearl={startEditingPearl}
      onStartNewPearl={startNewPearl}
      onTranscriptChange={updateTranscript}
      onUpdatePearl={updatePearl}
      onPearlCreated={(pearl) => setPearls((prev) => [pearl, ...prev])}
      pearls={pearls}
      persistenceMessage={persistenceMessage}
      selectedPearl={selectedPearl}
      visiblePearls={visiblePearls}
    />
  );
}

function toDraft(pearl: Pearl): PearlDraft {
  return {
    envelope: { ...pearl.envelope, tags: [...(pearl.envelope.tags ?? [])] },
    experientialRecord: pearl.experientialRecord,
    intellectualSynthesis: pearl.intellectualSynthesis,
    professorTranscript: [...pearl.professorTranscript],
    connections: [...pearl.connections],
    attachments: [...pearl.attachments],
  };
}
