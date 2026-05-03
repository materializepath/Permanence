"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { PearlReader } from "@/components/PearlReader";
import { SacredButton, SacredEmpty } from "@/components/sacred/Sacred";
import {
  loadPearlPositions,
  savePearlPosition,
  type PearlPosition,
} from "@/lib/pearls/store";
import { getPearlThumbnail } from "@/lib/pearls/thumbnails";
import type { Pearl } from "@/lib/pearls/types";

type DragState =
  | {
      kind: "canvas";
      pointerId: number;
      startX: number;
      startY: number;
      initialPan: PearlPosition;
    }
  | {
      kind: "pearl";
      pointerId: number;
      pearlId: string;
      startX: number;
      startY: number;
      initialPosition: PearlPosition;
      moved: boolean;
    }
  | {
      kind: "logo";
      pointerId: number;
      startX: number;
      startY: number;
      initialPosition: PearlPosition;
    };

type PearlCanvasProps = {
  pearls: Pearl[];
  onClosePearl: () => void;
  onDeletePearl: () => void;
  onSelectPearl: (id: string) => void;
  onStartEditingPearl: (pearl: Pearl) => void;
  onStartNewPearl: () => void;
  onTranscriptChange: Parameters<typeof PearlReader>[0]["onTranscriptChange"];
  onUpdatePearl: (pearl: Pearl) => void;
};

const LOGO = "Permanence";
const LOGO_FONT_CLASSES = [
  "canvas-logo__letter--mono",
  "canvas-logo__letter--serif",
  "canvas-logo__letter--sans",
  "canvas-logo__letter--cursive",
  "canvas-logo__letter--slab",
];
const LOGO_POSITION_KEY = "permanence.canvas-logo-position.v1";

export function PearlCanvas({
  pearls,
  onClosePearl,
  onDeletePearl,
  onSelectPearl,
  onStartEditingPearl,
  onStartNewPearl,
  onTranscriptChange,
  onUpdatePearl,
}: PearlCanvasProps) {
  const [positions, setPositions] = useState<Record<string, PearlPosition>>({});
  const [logoPosition, setLogoPosition] = useState<PearlPosition>({ x: 0, y: 0 });
  const [pan, setPan] = useState<PearlPosition>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [hoveredPearlId, setHoveredPearlId] = useState<string | null>(null);
  const [modalPearlId, setModalPearlId] = useState<string | null>(null);
  const dragState = useRef<DragState | null>(null);

  const placedPearls = useMemo(
    () =>
      pearls.map((pearl, index) => ({
        pearl,
        position: positions[pearl.id] ?? getDefaultPosition(pearl.id, index),
        thumbnail: getPearlThumbnail(pearl),
      })),
    [pearls, positions],
  );

  const modalPearl = pearls.find((pearl) => pearl.id === modalPearlId);
  const hoveredPearl = placedPearls.find(({ pearl }) => pearl.id === hoveredPearlId);

  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (!isMounted) {
        return;
      }

      setPositions(loadPearlPositions());
      setLogoPosition(loadLogoPosition());
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!modalPearlId) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModalPearlId(null);
        onClosePearl();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [modalPearlId, onClosePearl]);

  useEffect(() => {
    function clearHoverPreview() {
      setHoveredPearlId(null);
    }

    window.addEventListener("programmer-panel-interaction-start", clearHoverPreview);
    return () =>
      window.removeEventListener("programmer-panel-interaction-start", clearHoverPreview);
  }, []);

  function beginCanvasDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (modalPearlId) {
      return;
    }

    if (event.currentTarget !== event.target) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      kind: "canvas",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialPan: pan,
    };
  }

  function beginPearlDrag(
    event: React.PointerEvent<HTMLButtonElement>,
    pearlId: string,
    position: PearlPosition,
  ) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      kind: "pearl",
      pointerId: event.pointerId,
      pearlId,
      startX: event.clientX,
      startY: event.clientY,
      initialPosition: position,
      moved: false,
    };
  }

  function beginLogoDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      kind: "logo",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialPosition: logoPosition,
    };
  }

  function updateDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragState.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const delta = {
      x: event.clientX - drag.startX,
      y: event.clientY - drag.startY,
    };
    const worldDelta = {
      x: delta.x / zoom,
      y: delta.y / zoom,
    };

    if (drag.kind === "canvas") {
      setPan({
        x: drag.initialPan.x + delta.x,
        y: drag.initialPan.y + delta.y,
      });
      return;
    }

    if (drag.kind === "logo") {
      setLogoPosition({
        x: drag.initialPosition.x + worldDelta.x,
        y: drag.initialPosition.y + worldDelta.y,
      });
      return;
    }

    if (drag.kind === "pearl") {
      const nextPosition = {
        x: drag.initialPosition.x + worldDelta.x,
        y: drag.initialPosition.y + worldDelta.y,
      };
      drag.moved = drag.moved || Math.hypot(delta.x, delta.y) > 4;
      setPositions((current) => ({
        ...current,
        [drag.pearlId]: nextPosition,
      }));
    }
  }

  function zoomCanvas(event: React.WheelEvent<HTMLDivElement>) {
    if (modalPearlId) {
      return;
    }

    event.preventDefault();
    setZoom((current) => clamp(current - event.deltaY * 0.001, 0.45, 2.4));
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragState.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (drag.kind === "logo") {
      const finalPosition = {
        x: drag.initialPosition.x + (event.clientX - drag.startX) / zoom,
        y: drag.initialPosition.y + (event.clientY - drag.startY) / zoom,
      };
      setLogoPosition(finalPosition);
      saveLogoPosition(finalPosition);
    }

    if (drag.kind === "pearl") {
      const finalPosition = {
        x: drag.initialPosition.x + (event.clientX - drag.startX) / zoom,
        y: drag.initialPosition.y + (event.clientY - drag.startY) / zoom,
      };
      setPositions((current) => ({
        ...current,
        [drag.pearlId]: finalPosition,
      }));
      savePearlPosition(drag.pearlId, finalPosition);

      if (!drag.moved) {
        openPearl(drag.pearlId);
      }
    }

    dragState.current = null;
  }

  function openPearl(id: string) {
    setModalPearlId(id);
    onSelectPearl(id);
  }

  function closeModal() {
    setModalPearlId(null);
    onClosePearl();
  }

  return (
    <section
      className="pearl-canvas"
      onPointerDown={beginCanvasDrag}
      onPointerMove={updateDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={zoomCanvas}
    >
      <div
        className="pearl-canvas__world"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <CanvasLogo onPointerDown={beginLogoDrag} position={logoPosition} />

        {placedPearls.map(({ pearl, position, thumbnail }) => (
          <button
            className="pearl-node"
            key={pearl.id}
            onPointerDown={(event) => beginPearlDrag(event, pearl.id, position)}
            onPointerEnter={() => {
              if (!isProgrammerPanelInteracting()) {
                setHoveredPearlId(pearl.id);
              }
            }}
            onPointerLeave={() => setHoveredPearlId(null)}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            type="button"
          >
            {thumbnail.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img draggable={false} src={thumbnail.url} alt={thumbnail.alt} />
            ) : (
              <span className="pearl-node__placeholder">{thumbnail.label}</span>
            )}
          </button>
        ))}

        {hoveredPearl ? (
          <div
            className="pearl-hover-card sacred-popover-root"
            style={{
              transform: `translate(${hoveredPearl.position.x + 8}px, ${hoveredPearl.position.y + 8}px)`,
            }}
          >
            <strong>{hoveredPearl.pearl.envelope.title || "Untitled Pearl"}</strong>
            {hoveredPearl.thumbnail.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                draggable={false}
                src={hoveredPearl.thumbnail.url}
                alt={hoveredPearl.thumbnail.alt}
              />
            ) : (
              <span>{hoveredPearl.thumbnail.label}</span>
            )}
          </div>
        ) : null}
      </div>

      {!pearls.length ? (
        <div className="pearl-canvas__empty">
          <SacredEmpty title="No Pearls Yet.">
            <SacredButton onClick={onStartNewPearl} type="button">
              New Pearl
            </SacredButton>
          </SacredEmpty>
        </div>
      ) : null}

      {modalPearl ? (
        <div
          className="pearl-modal"
          role="dialog"
          aria-modal="true"
          onPointerDown={(event) => {
            if (event.currentTarget === event.target) {
              closeModal();
            }
          }}
        >
          <div
            className="pearl-modal__window"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <PearlReader
              onClosePearl={closeModal}
              onDeletePearl={onDeletePearl}
              onEditPearl={() => onStartEditingPearl(modalPearl)}
              onSelectPearl={openPearl}
              onTranscriptChange={onTranscriptChange}
              onUpdatePearl={onUpdatePearl}
              pearl={modalPearl}
              pearls={pearls}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CanvasLogo({
  position,
  onPointerDown,
}: {
  position: PearlPosition;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className="canvas-logo"
      onPointerDown={onPointerDown}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div className="canvas-logo__inner">
      <p aria-label={LOGO} className="canvas-logo__word">
        {LOGO.split("").map((letter, index) => (
          <LogoLetter index={index} key={`${letter}-${index}`}>
            {letter}
          </LogoLetter>
        ))}
      </p>
      <p className="canvas-logo__subtext">Powered by Hermes Agent</p>
      </div>
    </div>
  );
}

function LogoLetter({
  index,
  children,
}: {
  index: number;
  children: string;
}) {
  const [fontIndex, setFontIndex] = useState(index % LOGO_FONT_CLASSES.length);
  const [sizeOffset, setSizeOffset] = useState((index % 7) - 3);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setFontIndex((current) => (current + 1) % LOGO_FONT_CLASSES.length);
      setSizeOffset((current) => (current >= 3 ? -3 : current + 1));
    }, 460 + index * 97);

    return () => window.clearInterval(interval);
  }, [index]);

  return (
    <span
      className={`canvas-logo__letter ${LOGO_FONT_CLASSES[fontIndex]}`}
      style={{ fontSize: `calc(30pt + ${sizeOffset}pt)` }}
    >
      {children}
    </span>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function loadLogoPosition(): PearlPosition {
  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }

  try {
    const stored = window.localStorage.getItem(LOGO_POSITION_KEY);

    if (!stored) {
      return { x: 0, y: 0 };
    }

    const parsed = JSON.parse(stored) as PearlPosition;

    if (typeof parsed.x === "number" && typeof parsed.y === "number") {
      return parsed;
    }
  } catch {
    return { x: 0, y: 0 };
  }

  return { x: 0, y: 0 };
}

function saveLogoPosition(position: PearlPosition) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOGO_POSITION_KEY, JSON.stringify(position));
}

function getDefaultPosition(id: string, index: number): PearlPosition {
  const hash = hashString(id);
  const angle = (hash % 360) * (Math.PI / 180);
  const ring = index % 3;
  const radius = 210 + ring * 120 + ((hash >> 3) % 80);

  return {
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius),
  };
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function isProgrammerPanelInteracting() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.body.dataset.programmerPanelInteracting === "true";
}
