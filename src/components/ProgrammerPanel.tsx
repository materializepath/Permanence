"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  SacredButton,
  SacredEmpty,
  SacredMessage,
  SacredMessageLog,
  SacredMessageViewer,
  SacredOneLineLoader,
  getRandomSacredLoaderIndex,
} from "@/components/sacred/Sacred";
import { createId } from "@/lib/pearls/store";
import { USER_CONFIG_UPDATED_EVENT } from "@/lib/user-config/context";
import type { UserConfig } from "@/lib/programmer/file-store";

type ProgrammerMessage = {
  id: string;
  role: "user" | "programmer";
  content: string;
  changedFiles?: string[];
};

type ProgrammerLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
};

type ProgrammerChatResponse = {
  ok: boolean;
  summary: string;
  changedFiles: string[];
  userOverridesCssChanged: boolean;
  userConfigChanged: boolean;
  userConfig?: UserConfig;
  error?: string;
};

const STORAGE_KEY = "permanence.programmer-panel.v2";
const MIN_WIDTH = 320;
const MIN_HEIGHT = 220;
const DEFAULT_WIDTH = 420;
const DEFAULT_HEIGHT = 460;
const PANEL_MARGIN = 24;
const HEADER_HEIGHT = 56;

const RESIZE_HANDLES: ResizeHandle[] = [
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

type ResizeHandle =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export function ProgrammerPanel() {
  const [layout, setLayout] = useState<ProgrammerLayout | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [messages, setMessages] = useState<ProgrammerMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [loaderIndex, setLoaderIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const panelRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const resizeStateRef = useRef<{
    pointerId: number;
    handle: ResizeHandle;
    startX: number;
    startY: number;
    startLayout: ProgrammerLayout;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setLayout(loadLayout());
      setHasMounted(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasMounted || !layout) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [hasMounted, layout]);

  const updateLayout = useCallback(
    (updater: (current: ProgrammerLayout) => ProgrammerLayout) => {
      setLayout((current) => {
        if (!current) {
          return current;
        }

        return clampLayout(updater(current));
      });
    },
    [],
  );

  const handleCollapseToggle = useCallback(() => {
    updateLayout((current) => ({ ...current, collapsed: !current.collapsed }));
  }, [updateLayout]);

  const handleHeaderPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!layout || event.button !== 0) {
        return;
      }

      const target = event.target as HTMLElement | null;

      if (target?.closest("button")) {
        return;
      }

      const panel = panelRef.current;

      if (!panel) {
        return;
      }

      event.preventDefault();
      const rect = panel.getBoundingClientRect();
      dragStateRef.current = {
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
      };
      panel.setPointerCapture(event.pointerId);
    },
    [layout],
  );

  const handleHeaderPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragStateRef.current;

      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      updateLayout((current) => ({
        ...current,
        x: event.clientX - drag.offsetX,
        y: event.clientY - drag.offsetY,
      }));
    },
    [updateLayout],
  );

  const handleHeaderPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragStateRef.current;

      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      dragStateRef.current = null;
      panelRef.current?.releasePointerCapture?.(event.pointerId);
    },
    [],
  );

  const handleResizePointerDown = useCallback(
    (handle: ResizeHandle) => (event: ReactPointerEvent<HTMLSpanElement>) => {
      if (!layout || event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);
      resizeStateRef.current = {
        pointerId: event.pointerId,
        handle,
        startX: event.clientX,
        startY: event.clientY,
        startLayout: { ...layout },
      };
    },
    [layout],
  );

  const handleResizePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      const resize = resizeStateRef.current;

      if (!resize || resize.pointerId !== event.pointerId) {
        return;
      }

      const dx = event.clientX - resize.startX;
      const dy = event.clientY - resize.startY;
      const start = resize.startLayout;

      updateLayout(() => applyResize(start, resize.handle, dx, dy));
    },
    [updateLayout],
  );

  const handleResizePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      const resize = resizeStateRef.current;

      if (!resize || resize.pointerId !== event.pointerId) {
        return;
      }

      resizeStateRef.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    },
    [],
  );

  const askProgrammer = useCallback(async () => {
    const trimmed = input.trim();

    if (!trimmed || isThinking) {
      return;
    }

    const userMessage: ProgrammerMessage = {
      id: createId("user"),
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setErrorMessage("");
    setStatusNote("");
    setIsThinking(true);
    setLoaderIndex(getRandomSacredLoaderIndex());

    try {
      const response = await fetch("/api/programmer/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const body = (await response.json()) as ProgrammerChatResponse;

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "The Programmer could not finish.");
      }

      setMessages((current) => [
        ...current,
        {
          id: createId("programmer"),
          role: "programmer",
          content: body.summary || "Done.",
          changedFiles: body.changedFiles,
        },
      ]);

      if (body.changedFiles.length === 0) {
        setStatusNote("No files were changed.");
      } else {
        setStatusNote(formatChangedFilesNote(body.changedFiles));
      }

      if (body.userOverridesCssChanged) {
        refreshUserOverridesStylesheet();
      }

      if (body.userConfigChanged && body.userConfig) {
        dispatchUserConfigUpdate(body.userConfig);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking]);

  const panelStyle = useMemo<CSSProperties | undefined>(() => {
    if (!hasMounted || !layout) {
      return undefined;
    }

    const style: CSSProperties = {
      transform: `translate(${layout.x}px, ${layout.y}px)`,
      width: `${layout.width}px`,
    };

    if (!layout.collapsed) {
      style.height = `${layout.height}px`;
    }

    return style;
  }, [hasMounted, layout]);

  if (!hasMounted || !layout) {
    return null;
  }

  const className = layout.collapsed
    ? "programmer-panel programmer-panel--collapsed"
    : "programmer-panel";

  return (
    <section
      aria-label="Hermes Programmer"
      className={className}
      ref={panelRef}
      style={panelStyle}
    >
      <header
        className="programmer-panel__header"
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
        onPointerCancel={handleHeaderPointerUp}
      >
        <div className="programmer-panel__title">
          <strong>Hermes Programmer</strong>
          {layout.collapsed && isThinking ? (
            <span className="programmer-panel__collapsed-loader">
              <SacredOneLineLoader index={loaderIndex} />
            </span>
          ) : null}
        </div>
        <div className="programmer-panel__actions">
          <SacredButton
            aria-pressed={layout.collapsed}
            onClick={handleCollapseToggle}
            type="button"
          >
            {layout.collapsed ? "Expand" : "Collapse"}
          </SacredButton>
        </div>
      </header>

      {!layout.collapsed ? (
        <>
          <SacredMessageLog
            empty={
              <SacredEmpty title="Ask the Programmer to change something.">
                Edits are written directly to the workspace. Use git to revert
                anything you don&apos;t want to keep.
              </SacredEmpty>
            }
          >
            {messages.map((message) =>
              message.role === "user" ? (
                <SacredMessageViewer key={message.id} label="You">
                  {message.content}
                </SacredMessageViewer>
              ) : (
                <SacredMessage key={message.id} label="Programmer">
                  {message.content}
                </SacredMessage>
              ),
            )}
          </SacredMessageLog>

          {statusNote ? (
            <p className="programmer-panel__status">
              <span className="programmer-panel__status-note">{statusNote}</span>
            </p>
          ) : null}

          {errorMessage ? (
            <p className="programmer-panel__error">{errorMessage}</p>
          ) : null}

          <form
            className="programmer-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void askProgrammer();
            }}
          >
            <input
              className="sacred-input"
              disabled={isThinking}
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder="Describe a change"
              value={input}
            />
            <SacredButton
              disabled={isThinking || !input.trim()}
              tone="primary"
              type="submit"
            >
              {isThinking ? <SacredOneLineLoader index={loaderIndex} /> : "Send"}
            </SacredButton>
          </form>
        </>
      ) : null}

      {!layout.collapsed
        ? RESIZE_HANDLES.map((handle) => (
            <span
              aria-hidden="true"
              className={`programmer-panel__resize programmer-panel__resize--${handle}`}
              key={handle}
              onPointerDown={handleResizePointerDown(handle)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              onPointerCancel={handleResizePointerUp}
            />
          ))
        : null}
    </section>
  );
}

function loadLayout(): ProgrammerLayout {
  const fallback = defaultLayout();

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<ProgrammerLayout>;

    return clampLayout({
      x: typeof parsed.x === "number" ? parsed.x : fallback.x,
      y: typeof parsed.y === "number" ? parsed.y : fallback.y,
      width:
        typeof parsed.width === "number" ? parsed.width : fallback.width,
      height:
        typeof parsed.height === "number" ? parsed.height : fallback.height,
      collapsed: parsed.collapsed === true,
    });
  } catch {
    return fallback;
  }
}

function defaultLayout(): ProgrammerLayout {
  if (typeof window === "undefined") {
    return {
      x: 100,
      y: 100,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      collapsed: false,
    };
  }

  const x = Math.max(
    PANEL_MARGIN,
    window.innerWidth - DEFAULT_WIDTH - PANEL_MARGIN,
  );
  const y = Math.max(
    PANEL_MARGIN,
    window.innerHeight - DEFAULT_HEIGHT - PANEL_MARGIN,
  );

  return {
    x,
    y,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    collapsed: false,
  };
}

function clampLayout(layout: ProgrammerLayout): ProgrammerLayout {
  if (typeof window === "undefined") {
    return layout;
  }

  const width = Math.max(
    MIN_WIDTH,
    Math.min(layout.width, window.innerWidth - PANEL_MARGIN),
  );
  const height = Math.max(
    MIN_HEIGHT,
    Math.min(layout.height, window.innerHeight - PANEL_MARGIN),
  );
  const x = Math.max(
    PANEL_MARGIN - width,
    Math.min(layout.x, window.innerWidth - PANEL_MARGIN),
  );
  const y = Math.max(
    0,
    Math.min(layout.y, window.innerHeight - HEADER_HEIGHT),
  );

  return {
    x,
    y,
    width,
    height,
    collapsed: layout.collapsed,
  };
}

function applyResize(
  start: ProgrammerLayout,
  handle: ResizeHandle,
  dx: number,
  dy: number,
): ProgrammerLayout {
  let { x, y, width, height } = start;

  if (handle.includes("right")) {
    width = start.width + dx;
  }

  if (handle.includes("left")) {
    width = start.width - dx;
    x = start.x + dx;
  }

  if (handle.includes("bottom")) {
    height = start.height + dy;
  }

  if (handle.includes("top")) {
    height = start.height - dy;
    y = start.y + dy;
  }

  if (width < MIN_WIDTH) {
    if (handle.includes("left")) {
      x = start.x + (start.width - MIN_WIDTH);
    }
    width = MIN_WIDTH;
  }

  if (height < MIN_HEIGHT) {
    if (handle.includes("top")) {
      y = start.y + (start.height - MIN_HEIGHT);
    }
    height = MIN_HEIGHT;
  }

  return { ...start, x, y, width, height };
}

function formatChangedFilesNote(changedFiles: string[]) {
  if (changedFiles.length === 1) {
    return `Changed ${changedFiles[0]}.`;
  }

  if (changedFiles.length <= 3) {
    return `Changed ${changedFiles.join(", ")}.`;
  }

  return `Changed ${changedFiles.length} files.`;
}

function refreshUserOverridesStylesheet() {
  if (typeof document === "undefined") {
    return;
  }

  const link = document.querySelector<HTMLLinkElement>(
    'link[data-user-overrides="true"]',
  );

  if (!link) {
    return;
  }

  const url = new URL(link.href, window.location.href);
  url.searchParams.set("v", String(Date.now()));
  link.href = url.toString();
}

function dispatchUserConfigUpdate(config: UserConfig) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(USER_CONFIG_UPDATED_EVENT, { detail: config }),
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The Programmer could not finish.";
}
