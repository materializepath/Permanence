"use client";

import { useEffect, useMemo, useState } from "react";
import { SpatialPearlArchive } from "@/components/SpatialPearlArchive";
import {
  createPearl,
  deletePearl,
  emptyPearlDraft,
  loadPearls,
  savePearls,
  searchPearls,
  updatePearl,
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
  const [filters, setFilters] = useState<PearlFiltersType>({
    query: "",
    sourceType: "all",
    tag: "",
  });

  useEffect(() => {
    // localStorage is browser-only, so hydrate it after the static shell loads.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPearls(loadPearls());
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
      return;
    }

    if (mode === "edit" && selectedPearl) {
      updatePearl(selectedPearl.id, draft, pearls);
      const nextPearls = loadPearls();
      setPearls(nextPearls);
      setSelectedPearlId(selectedPearl.id);
      setMode("view");
    }
  }

  function removeSelectedPearl() {
    if (!selectedPearl) {
      return;
    }

    const nextPearls = deletePearl(selectedPearl.id, pearls);
    setPearls(nextPearls);
    setSelectedPearlId(null);
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

    savePearls(nextPearls);
    setPearls(nextPearls);
  }

  return (
    <SpatialPearlArchive
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
      pearls={pearls}
      selectedPearl={selectedPearl}
      visiblePearls={visiblePearls}
    />
  );
}

function toDraft(pearl: Pearl): PearlDraft {
  return {
    envelope: { ...pearl.envelope, tags: [...pearl.envelope.tags] },
    experientialRecord: pearl.experientialRecord,
    intellectualSynthesis: pearl.intellectualSynthesis,
    professorTranscript: [...pearl.professorTranscript],
    connections: [...pearl.connections],
    attachments: [...pearl.attachments],
  };
}
