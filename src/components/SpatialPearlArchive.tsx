"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate } from "@/lib/pearls/format";
import { sourceTypes, type Pearl, type PearlDraft, type PearlFilters } from "@/lib/pearls/types";
import { PearlForm } from "@/components/PearlForm";
import { ProfessorPanel } from "@/components/ProfessorPanel";
import { ThreadingPanel } from "@/components/ThreadingPanel";
import { loadPearlPositions, savePearlPosition, type PearlPosition } from "@/lib/pearls/store";

type WorkspaceMode = "view" | "new" | "edit";

type SpatialPearlArchiveProps = {
  pearls: Pearl[];
  visiblePearls: Pearl[];
  selectedPearl?: Pearl;
  mode: WorkspaceMode;
  draft: PearlDraft;
  filters: PearlFilters;
  onSelectPearl: (id: string) => void;
  onStartNewPearl: () => void;
  onStartEditingPearl: (pearl: Pearl) => void;
  onClosePearl: () => void;
  onDeletePearl: () => void;
  onSaveDraft: () => void;
  onCancelDraft: () => void;
  onDraftChange: (draft: PearlDraft) => void;
  onFiltersChange: (filters: PearlFilters) => void;
  onTranscriptChange: Parameters<typeof ProfessorPanel>[0]["onTranscriptChange"];
};

type Vec = { x: number; y: number };

type ViewTransform = {
  x: number;
  y: number;
  scale: number;
};

type DragState =
  | {
      mode: "pan";
      pointerId: number;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
      didDrag: boolean;
    }
  | {
      mode: "pearl";
      pointerId: number;
      startX: number;
      startY: number;
      pearlId: string;
      offsetX: number;
      offsetY: number;
      didDrag: boolean;
    };

const sourcePalette = new Map<string, string>([
  ["exhibition", "#f4b86f"],
  ["film", "#9ed7f2"],
  ["book", "#f1d56f"],
  ["artist", "#f1a6d6"],
  ["website", "#8ee6cf"],
  ["article", "#b7a6f4"],
  ["music", "#ffb08a"],
  ["conversation", "#d5e88f"],
  ["place", "#c78d5d"],
  ["other", "#e8caa3"],
]);

const accentPalette = ["#f6ccff", "#c5f7ff", "#fff0bf"];

const WORLD_RADIUS = 2400;
const PEARL_BASE_RADIUS = 44;
const SEPARATION_MARGIN = 14;
const VIEW_LERP = 0.22;
const SCALE_LERP = 0.18;
const PEARL_DRAG_LERP = 0.34;
const PEARL_REST_LERP = 0.18;
const MIN_SCALE = 0.55;
const MAX_SCALE = 2.2;
const LABEL_GAP_PX = 22;

export function SpatialPearlArchive({
  pearls,
  visiblePearls,
  selectedPearl,
  mode,
  draft,
  filters,
  onSelectPearl,
  onStartNewPearl,
  onStartEditingPearl,
  onClosePearl,
  onDeletePearl,
  onSaveDraft,
  onCancelDraft,
  onDraftChange,
  onFiltersChange,
  onTranscriptChange,
}: SpatialPearlArchiveProps) {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);
  const pearlElementsRef = useRef<Map<string, HTMLButtonElement>>(new Map());

  const positionsRef = useRef<Map<string, Vec>>(new Map());
  const targetPositionsRef = useRef<Map<string, Vec>>(new Map());
  const sizesRef = useRef<Map<string, number>>(new Map());
  const storedPositionsRef = useRef<Record<string, PearlPosition> | null>(null);

  const viewRef = useRef<ViewTransform>({ x: 110, y: 0, scale: 1 });
  const targetViewRef = useRef<ViewTransform>({ x: 110, y: 0, scale: 1 });

  const dragRef = useRef<DragState | null>(null);

  const recentPearls = useMemo(() => {
    return [...pearls]
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
      .slice(0, 5);
  }, [pearls]);

  const sourceTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const pearl of pearls) {
      counts.set(pearl.envelope.sourceType, (counts.get(pearl.envelope.sourceType) ?? 0) + 1);
    }
    return counts;
  }, [pearls]);

  // Initialize per-pearl position and size synchronously so the very first paint
  // places each Pearl in the right spot. Idempotent — only fills in new entries.
  if (storedPositionsRef.current === null && typeof window !== "undefined") {
    storedPositionsRef.current = loadPearlPositions();
  }
  const stored = storedPositionsRef.current ?? {};
  pearls.forEach((pearl, index) => {
    if (!sizesRef.current.has(pearl.id)) {
      sizesRef.current.set(pearl.id, sizeFor(index));
    }
    if (!positionsRef.current.has(pearl.id)) {
      const initial = stored[pearl.id] ?? initialPosition(index);
      positionsRef.current.set(pearl.id, { x: initial.x, y: initial.y });
      targetPositionsRef.current.set(pearl.id, { x: initial.x, y: initial.y });
    }
  });
  const liveIds = new Set(pearls.map((pearl) => pearl.id));
  for (const id of Array.from(positionsRef.current.keys())) {
    if (!liveIds.has(id)) {
      positionsRef.current.delete(id);
      targetPositionsRef.current.delete(id);
      sizesRef.current.delete(id);
    }
  }

  // RAF loop: smooth view, smooth pearl positions, run separation physics, write transforms.
  useEffect(() => {
    let raf = 0;

    function tick() {
      stepView(viewRef.current, targetViewRef.current, tableRef.current);
      stepPearls(
        positionsRef.current,
        targetPositionsRef.current,
        sizesRef.current,
        dragRef.current,
      );

      const plane = planeRef.current;
      if (plane) {
        const v = viewRef.current;
        plane.style.transform = `translate(-50%, -50%) translate3d(${v.x.toFixed(2)}px, ${v.y.toFixed(2)}px, 0) scale(${v.scale.toFixed(4)})`;
      }

      pearlElementsRef.current.forEach((el, id) => {
        const p = positionsRef.current.get(id);
        if (!p) {
          return;
        }
        el.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
      });

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Wheel zoom with cursor-anchored scaling. Attached imperatively so we can preventDefault.
  useEffect(() => {
    const el = tableRef.current;
    if (!el) {
      return;
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const t = targetViewRef.current;
      const oldScale = t.scale;
      const newScale = clamp(oldScale - event.deltaY * 0.0014, MIN_SCALE, MAX_SCALE);
      if (newScale === oldScale) {
        return;
      }

      const rect = el?.getBoundingClientRect();
      if (rect) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const worldX = (event.clientX - cx - t.x) / oldScale;
        const worldY = (event.clientY - cy - t.y) / oldScale;
        t.x = event.clientX - cx - worldX * newScale;
        t.y = event.clientY - cy - worldY * newScale;
      }
      t.scale = newScale;
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function screenToWorld(sx: number, sy: number): Vec {
    const rect = tableRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const v = viewRef.current;
    return {
      x: (sx - cx - v.x) / v.scale,
      y: (sy - cy - v.y) / v.scale,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    const pearlEl = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-pearl-id]",
    );

    if (pearlEl) {
      const id = pearlEl.dataset.pearlId;
      const pos = id ? positionsRef.current.get(id) : undefined;
      if (id && pos) {
        const world = screenToWorld(event.clientX, event.clientY);
        dragRef.current = {
          mode: "pearl",
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          pearlId: id,
          offsetX: pos.x - world.x,
          offsetY: pos.y - world.y,
          didDrag: false,
        };
      }
    } else {
      dragRef.current = {
        mode: "pan",
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: targetViewRef.current.x,
        originY: targetViewRef.current.y,
        didDrag: false,
      };
    }

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) {
      drag.didDrag = true;
    }

    if (drag.mode === "pan") {
      targetViewRef.current.x = drag.originX + dx;
      targetViewRef.current.y = drag.originY + dy;
    } else {
      const world = screenToWorld(event.clientX, event.clientY);
      const target = targetPositionsRef.current.get(drag.pearlId);
      if (target) {
        target.x = world.x + drag.offsetX;
        target.y = world.y + drag.offsetY;
      }
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (drag.mode === "pearl" && !drag.didDrag) {
      onSelectPearl(drag.pearlId);
    } else if (drag.mode === "pearl") {
      const target = targetPositionsRef.current.get(drag.pearlId);
      if (target) {
        savePearlPosition(drag.pearlId, target);
      }
    }

    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handlePointerCancel(event: React.PointerEvent<HTMLElement>) {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <main className="spatial-shell topdown-shell">
      <div className="memory-haze" aria-hidden="true" />

      <section
        aria-label="Top-down Pearl field"
        className="pearl-table"
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={tableRef}
      >
        <div className="pearl-plane" ref={planeRef}>
          <div className="map-terrain" aria-hidden="true" />
          {visiblePearls.map((pearl) => {
            const stableIndex = pearls.findIndex((candidate) => candidate.id === pearl.id);
            const safeIndex = stableIndex < 0 ? 0 : stableIndex;
            const sizeFactor = sizesRef.current.get(pearl.id) ?? sizeFor(safeIndex);
            const diameter = sizeFactor * PEARL_BASE_RADIUS * 2;
            const color = sourcePalette.get(pearl.envelope.sourceType) ?? "#e8e1d7";
            const accent = accentPalette[safeIndex % accentPalette.length];

            return (
              <button
                aria-label={pearl.envelope.title || "Untitled Pearl"}
                className={
                  pearl.id === selectedPearl?.id
                    ? "map-pearl-button active"
                    : "map-pearl-button"
                }
                data-pearl-id={pearl.id}
                key={pearl.id}
                ref={(el) => {
                  const map = pearlElementsRef.current;
                  if (!el) {
                    return;
                  }
                  map.set(pearl.id, el);
                  const p = positionsRef.current.get(pearl.id);
                  if (p) {
                    el.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
                  }
                  return () => {
                    map.delete(pearl.id);
                  };
                }}
                style={
                  {
                    "--pearl-size": `${diameter.toFixed(2)}px`,
                    "--label-offset": `${LABEL_GAP_PX}px`,
                    "--map-color": color,
                    "--map-accent": accent,
                  } as React.CSSProperties
                }
                type="button"
              >
                <span className="map-pearl-shadow" aria-hidden="true" />
                <span className="map-pearl" />
                <span className="map-label">
                  <span>{pearl.envelope.title || "Untitled Pearl"}</span>
                  <small>{pearl.envelope.sourceType}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="archive-plate" aria-hidden="true" />

      <aside className="archive-sidebar" aria-label="Permanence archive">
        <header className="archive-mark">
          <h1>Permanence</h1>
          <p>
            <span>an archive of</span>
            <br />
            <span>creative encounters</span>
          </p>
        </header>

        <button
          className="archive-new-pearl"
          onClick={onStartNewPearl}
          type="button"
        >
          + New Pearl
        </button>

        <nav className="category-list" aria-label="Filter pearls by source type">
          <button
            className={
              !filters.sourceType || filters.sourceType === "all"
                ? "category-item active"
                : "category-item"
            }
            onClick={() => onFiltersChange({ ...filters, sourceType: "all" })}
            type="button"
          >
            <span className="category-name">All Pearls</span>
            <span className="category-count">{pearls.length}</span>
          </button>
          {sourceTypes
            .filter(
              (sourceType) =>
                (sourceTypeCounts.get(sourceType) ?? 0) > 0 ||
                filters.sourceType === sourceType,
            )
            .map((sourceType) => (
              <button
                className={
                  filters.sourceType === sourceType
                    ? "category-item active"
                    : "category-item"
                }
                key={sourceType}
                onClick={() => onFiltersChange({ ...filters, sourceType })}
                type="button"
              >
                <span className="category-name">{sourceType}</span>
                <span className="category-count">
                  {sourceTypeCounts.get(sourceType) ?? 0}
                </span>
              </button>
            ))}
        </nav>

        {recentPearls.length > 0 && (
          <div className="archive-recent">
            <p className="archive-recent-label">Recent</p>
            <div className="recent-grid">
              {recentPearls.map((pearl) => {
                const color =
                  sourcePalette.get(pearl.envelope.sourceType) ?? "#d6c5ad";
                return (
                  <button
                    className="recent-thumb"
                    key={pearl.id}
                    onClick={() => onSelectPearl(pearl.id)}
                    style={{ "--map-color": color } as React.CSSProperties}
                    title={pearl.envelope.title || "Untitled Pearl"}
                    type="button"
                  >
                    <span className="recent-thumb-pearl" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button className="archive-filters" type="button">
          Filters
        </button>
      </aside>

      <p className="archive-tagline" aria-hidden="true">
        <span>A living archive of</span>
        <span>what moves you</span>
      </p>

      <div className="search-pill">
        <input
          aria-label="Search encounters"
          onChange={(event) =>
            onFiltersChange({ ...filters, query: event.currentTarget.value })
          }
          placeholder="Search encounters..."
          value={filters.query ?? ""}
        />
      </div>

      {selectedPearl && (
        <PearlDetailPage
          key={selectedPearl.id}
          onClosePearl={onClosePearl}
          onDeletePearl={onDeletePearl}
          onEditPearl={() => onStartEditingPearl(selectedPearl)}
          onSelectPearl={onSelectPearl}
          onTranscriptChange={onTranscriptChange}
          pearl={selectedPearl}
          pearls={pearls}
        />
      )}

      {(mode === "new" || mode === "edit") && (
        <div className="spatial-drawer" role="dialog" aria-modal="true">
          <PearlForm
            currentPearlId={mode === "edit" ? selectedPearl?.id : undefined}
            draft={draft}
            onCancel={onCancelDraft}
            onChange={onDraftChange}
            onSave={onSaveDraft}
            pearls={pearls}
          />
        </div>
      )}
    </main>
  );
}

function stepView(
  v: ViewTransform,
  t: ViewTransform,
  table: HTMLDivElement | null,
) {
  v.x += (t.x - v.x) * VIEW_LERP;
  v.y += (t.y - v.y) * VIEW_LERP;
  v.scale += (t.scale - v.scale) * SCALE_LERP;

  if (!table) {
    return;
  }

  const rect = table.getBoundingClientRect();
  const halfW = rect.width / 2;
  const halfH = rect.height / 2;
  const reachX = Math.max(0, WORLD_RADIUS * v.scale - halfW);
  const reachY = Math.max(0, WORLD_RADIUS * v.scale - halfH);

  v.x = clamp(v.x, -reachX, reachX);
  v.y = clamp(v.y, -reachY, reachY);
  t.x = clamp(t.x, -reachX, reachX);
  t.y = clamp(t.y, -reachY, reachY);
}

function stepPearls(
  positions: Map<string, Vec>,
  targets: Map<string, Vec>,
  sizes: Map<string, number>,
  drag: DragState | null,
) {
  const draggedId = drag?.mode === "pearl" ? drag.pearlId : null;

  positions.forEach((p, id) => {
    const target = targets.get(id);
    if (!target) {
      return;
    }
    const lerp = id === draggedId ? PEARL_DRAG_LERP : PEARL_REST_LERP;
    p.x += (target.x - p.x) * lerp;
    p.y += (target.y - p.y) * lerp;
  });

  const ids = Array.from(positions.keys());
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const aId = ids[i];
      const bId = ids[j];
      const a = positions.get(aId);
      const b = positions.get(bId);
      if (!a || !b) {
        continue;
      }

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distSq = dx * dx + dy * dy;
      const ra = (sizes.get(aId) ?? 1) * PEARL_BASE_RADIUS;
      const rb = (sizes.get(bId) ?? 1) * PEARL_BASE_RADIUS;
      const minDist = ra + rb + SEPARATION_MARGIN;

      if (distSq >= minDist * minDist) {
        continue;
      }

      const dist = Math.sqrt(distSq) || 0.001;
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;

      const aDragged = aId === draggedId;
      const bDragged = bId === draggedId;
      const aTarget = targets.get(aId);
      const bTarget = targets.get(bId);

      if (aDragged && !bDragged) {
        b.x += nx * overlap;
        b.y += ny * overlap;
        if (bTarget) {
          bTarget.x += nx * overlap * 0.45;
          bTarget.y += ny * overlap * 0.45;
        }
      } else if (bDragged && !aDragged) {
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        if (aTarget) {
          aTarget.x -= nx * overlap * 0.45;
          aTarget.y -= ny * overlap * 0.45;
        }
      } else {
        const half = overlap * 0.5;
        a.x -= nx * half;
        a.y -= ny * half;
        b.x += nx * half;
        b.y += ny * half;
        if (aTarget) {
          aTarget.x -= nx * half * 0.45;
          aTarget.y -= ny * half * 0.45;
        }
        if (bTarget) {
          bTarget.x += nx * half * 0.45;
          bTarget.y += ny * half * 0.45;
        }
      }
    }
  }

  const wallR = WORLD_RADIUS - PEARL_BASE_RADIUS;
  positions.forEach((p) => {
    p.x = clamp(p.x, -wallR, wallR);
    p.y = clamp(p.y, -wallR, wallR);
  });
  targets.forEach((p) => {
    p.x = clamp(p.x, -wallR, wallR);
    p.y = clamp(p.y, -wallR, wallR);
  });
}

type DetailOverlay = "professor" | "threading" | null;

function PearlDetailPage({
  pearl,
  pearls,
  onEditPearl,
  onClosePearl,
  onDeletePearl,
  onSelectPearl,
  onTranscriptChange,
}: {
  pearl: Pearl;
  pearls: Pearl[];
  onEditPearl: () => void;
  onClosePearl: () => void;
  onDeletePearl: () => void;
  onSelectPearl: (id: string) => void;
  onTranscriptChange: Parameters<typeof ProfessorPanel>[0]["onTranscriptChange"];
}) {
  const [overlay, setOverlay] = useState<DetailOverlay>(null);

  const pearlTone = sourcePalette.get(pearl.envelope.sourceType) ?? "#e8e1d7";
  const accentSeed = hashString(pearl.id);
  const pearlAccent = accentPalette[accentSeed % accentPalette.length];
  const pearlLookup = new Map(pearls.map((candidate) => [candidate.id, candidate]));

  const transcriptCount = pearl.professorTranscript.length;
  const lastProfessorMessage =
    pearl.professorTranscript[pearl.professorTranscript.length - 1];
  const connectionCount = pearl.connections.length;

  const sourceUrl = sourceAsUrl(pearl.envelope.source);
  const formattedDate = formatDate(pearl.envelope.encounterDate);

  return (
    <aside className="pearl-detail-page" aria-label="Selected Pearl">
      <div className="pearl-detail-orbits" aria-hidden="true">
        <span className="orbit-bead orbit-bead--one" />
        <span className="orbit-bead orbit-bead--two" />
        <span className="orbit-bead orbit-bead--three" />
      </div>

      <div className="pearl-detail-shell">
        <header className="detail-topbar">
          <button className="detail-link" onClick={onClosePearl} type="button">
            <span aria-hidden="true">←</span> All Pearls
          </button>
          <span className="detail-topbar-status">
            <span className="detail-status-bead" aria-hidden="true" />
            Opened
          </span>
          <div className="detail-topbar-actions">
            <button className="detail-pill" onClick={onEditPearl} type="button">
              Edit Pearl
            </button>
            <button
              className="detail-pill detail-pill--ghost"
              onClick={onDeletePearl}
              type="button"
            >
              Delete
            </button>
          </div>
        </header>

        <section className="detail-hero">
          <div className="detail-hero-pearl" aria-hidden="true">
            <div
              className="detail-hero-orb"
              style={
                {
                  "--detail-pearl-color": pearlTone,
                  "--detail-pearl-accent": pearlAccent,
                } as React.CSSProperties
              }
            />
          </div>

          <div className="detail-hero-text">
            <h1 className="detail-hero-headline">
              {pearl.envelope.title || "Untitled Pearl"}
            </h1>
            <p className="detail-hero-locale">
              {[pearl.envelope.source, formattedDate]
                .filter((piece) => piece && piece !== "Undated")
                .join(", ") || "Encounter details to come"}
              <span className="detail-hero-locale-bead" aria-hidden="true" />
            </p>
          </div>

          <aside className="detail-hero-meta">
            <div className="detail-meta-tags">
              <span className="detail-tag detail-tag--type">
                {capitalize(pearl.envelope.sourceType)}
              </span>
              {pearl.envelope.tags.slice(0, 2).map((tag) => (
                <span className="detail-tag" key={tag}>
                  {capitalize(tag)}
                </span>
              ))}
            </div>

            <dl className="detail-meta-list">
              <div>
                <dt>Source</dt>
                <dd>{pearl.envelope.source || "—"}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{formattedDate}</dd>
              </div>
              <div>
                <dt>Resonance</dt>
                <dd>{moodSummary(pearl.envelope.mood)}</dd>
              </div>
            </dl>

            {sourceUrl ? (
              <a
                className="detail-pill detail-pill--link"
                href={sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                View Original Source <span aria-hidden="true">↗</span>
              </a>
            ) : null}
          </aside>
        </section>

        <section className="detail-layers" aria-label="Pearl layers">
          <article className="detail-card detail-card--text">
            <p className="detail-kicker">Experiential Record</p>
            <p className="detail-card-body">
              {layerText(pearl.experientialRecord, pearl.envelope.title, "experience")}
            </p>
            {pearl.envelope.mood ? (
              <p className="detail-card-footnote">
                <span className="detail-card-footnote-label">Mood</span>
                {pearl.envelope.mood}
              </p>
            ) : null}
          </article>

          <article className="detail-card detail-card--text">
            <p className="detail-kicker">Intellectual Synthesis</p>
            <p className="detail-card-body">
              {layerText(pearl.intellectualSynthesis, pearl.envelope.title, "synthesis")}
            </p>
            {pearl.envelope.tags.length ? (
              <div className="detail-card-tag-row">
                {pearl.envelope.tags.slice(0, 4).map((tag) => (
                  <span className="detail-card-chip" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </article>

          <article className="detail-card detail-card--professor">
            <p className="detail-kicker">Professor Transcript</p>
            {lastProfessorMessage ? (
              <>
                <p className="detail-card-quote">
                  &ldquo;{truncate(lastProfessorMessage.content, 220)}&rdquo;
                </p>
                <p className="detail-card-meta">
                  {transcriptCount} saved exchange{transcriptCount === 1 ? "" : "s"}
                  {" · "}
                  last from <em>{lastProfessorMessage.role}</em>
                </p>
              </>
            ) : (
              <p className="detail-card-body">
                No Professor session yet. Open a dialogue to record questions,
                references, or pushback as a permanent layer of this Pearl.
              </p>
            )}
            <button
              className="detail-pill detail-pill--solid"
              onClick={() => setOverlay("professor")}
              type="button"
            >
              Open session
            </button>
          </article>
        </section>

        <section className="detail-bottom" aria-label="Connections">
          <article className="detail-card detail-card--related">
            <header className="detail-card-head">
              <p className="detail-kicker">Related Pearls</p>
              <span className="detail-card-meta">
                {connectionCount} link{connectionCount === 1 ? "" : "s"}
              </span>
            </header>
            {connectionCount ? (
              <ul className="detail-related-list">
                {pearl.connections.slice(0, 5).map((connection) => {
                  const target = pearlLookup.get(connection.targetPearlId);
                  const targetTone = target
                    ? sourcePalette.get(target.envelope.sourceType) ?? "#e8e1d7"
                    : "#e8e1d7";
                  return (
                    <li key={connection.id}>
                      <button
                        className="detail-related-item"
                        onClick={() =>
                          target ? onSelectPearl(target.id) : null
                        }
                        type="button"
                      >
                        <span
                          className="detail-related-bead"
                          style={
                            {
                              "--detail-pearl-color": targetTone,
                            } as React.CSSProperties
                          }
                          aria-hidden="true"
                        />
                        <span className="detail-related-text">
                          <strong>{target?.envelope.title ?? "Missing Pearl"}</strong>
                          <small>
                            {target
                              ? `${capitalize(target.envelope.sourceType)} · ${formatDate(target.envelope.encounterDate)}`
                              : "Connection target was removed"}
                          </small>
                          <em>{connection.note || "Connection note ready to be written."}</em>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="detail-card-body">
                No explicit connections yet. Add one from <em>Edit Pearl</em> when
                another encounter starts to echo this one.
              </p>
            )}
          </article>

          <article className="detail-card detail-card--graph">
            <p className="detail-kicker">Connection Graph</p>
            <p className="detail-card-body">
              This Pearl holds {connectionCount} explicit connection
              {connectionCount === 1 ? "" : "s"} and lives inside a library of
              {" "}
              {pearls.length} pearls.
            </p>
            <div className="detail-graph" aria-hidden="true">
              <span className="detail-graph-node detail-graph-node--center" />
              <span className="detail-graph-node detail-graph-node--a" />
              <span className="detail-graph-node detail-graph-node--b" />
              <span className="detail-graph-node detail-graph-node--c" />
              <span className="detail-graph-node detail-graph-node--d" />
              <span className="detail-graph-line detail-graph-line--a" />
              <span className="detail-graph-line detail-graph-line--b" />
              <span className="detail-graph-line detail-graph-line--c" />
              <span className="detail-graph-line detail-graph-line--d" />
            </div>
            <button
              className="detail-pill detail-pill--solid"
              onClick={() => setOverlay("threading")}
              type="button"
            >
              Explore Connections <span aria-hidden="true">↗</span>
            </button>
          </article>
        </section>

        {overlay === "professor" ? (
          <section className="detail-overlay" aria-label="Professor session">
            <header className="detail-overlay-head">
              <p className="detail-kicker">Professor — live session</p>
              <button
                className="detail-link"
                onClick={() => setOverlay(null)}
                type="button"
              >
                Close session
              </button>
            </header>
            <ProfessorPanel onTranscriptChange={onTranscriptChange} pearl={pearl} />
          </section>
        ) : null}

        {overlay === "threading" ? (
          <section className="detail-overlay" aria-label="Threading briefing">
            <header className="detail-overlay-head">
              <p className="detail-kicker">Threading — project briefing</p>
              <button
                className="detail-link"
                onClick={() => setOverlay(null)}
                type="button"
              >
                Close briefing
              </button>
            </header>
            <ThreadingPanel pearls={pearls} onSelectPearl={onSelectPearl} />
          </section>
        ) : null}
      </div>
    </aside>
  );
}

function layerText(value: string, title: string, layer: "experience" | "synthesis") {
  if (value.trim()) {
    return value;
  }

  if (layer === "experience") {
    return `${title || "This Pearl"} still needs its encounter record: the room, texture, sequence, surprises, and the first-person details that will make it findable years from now.`;
  }

  return `${title || "This Pearl"} is ready for the analytical pass: what it changed, what it connects to, and why it might matter for future work.`;
}

function moodSummary(mood: string) {
  const trimmed = mood.trim();
  if (!trimmed) {
    return "Not yet noted";
  }

  // Pull the first short phrase as a "Resonance" hint, matching the reference's
  // single-line meta entries. The full mood lives inside the Experiential Record card.
  const firstClause = trimmed.split(/[.,;:]/)[0]?.trim() ?? trimmed;
  return firstClause.length > 48 ? `${firstClause.slice(0, 46)}…` : firstClause;
}

function truncate(value: string, max: number) {
  const clean = value.trim();
  if (clean.length <= max) {
    return clean;
  }
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function capitalize(value: string) {
  if (!value) {
    return value;
  }
  return value[0].toUpperCase() + value.slice(1);
}

function sourceAsUrl(source: string) {
  const trimmed = source.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const candidate = trimmed.match(/^https?:\/\//i)
      ? trimmed
      : trimmed.startsWith("www.")
        ? `https://${trimmed}`
        : null;
    if (!candidate) {
      return null;
    }
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function initialPosition(index: number): PearlPosition {
  const angle = index * 2.399963229728653;
  const radius = 130 * Math.sqrt(index + 0.55);
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius * 0.86,
  };
}

function sizeFor(index: number): number {
  return 0.86 + ((index * 37) % 8) * 0.05;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
