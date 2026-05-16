"use client";

import { useEffect, useState } from "react";
import { PearlCanvas } from "@/components/PearlCanvas";
import { PearlDraftModal } from "@/components/PearlDraftModal";
import { PearlForm } from "@/components/PearlForm";
import { PearlReader } from "@/components/PearlReader";
import { ProgrammerPanel } from "@/components/ProgrammerPanel";
import { IngestionPanel } from "@/components/canvas/IngestionPanel";
import {
  SacredActionButton,
  SacredButton,
  SacredEmpty,
  SacredField,
  SacredPanel,
  SacredRoot,
  SacredWindow,
} from "@/components/sacred/Sacred";
import { formatDate } from "@/lib/pearls/format";
import {
  type Pearl,
  type PearlDraft,
  type PearlFilters,
} from "@/lib/pearls/types";
import { useUserConfig } from "@/lib/user-config/context";

type WorkspaceMode = "view" | "new" | "edit";
type HomeView = "canvas" | "list";

type PermanenceShellProps = {
  pearls: Pearl[];
  visiblePearls: Pearl[];
  selectedPearl?: Pearl;
  mode: WorkspaceMode;
  draft: PearlDraft;
  filters: PearlFilters;
  persistenceMessage: string;
  onSelectPearl: (id: string) => void;
  onStartNewPearl: () => void;
  onStartEditingPearl: (pearl: Pearl) => void;
  onClosePearl: () => void;
  onDeletePearl: () => void;
  onSaveDraft: () => void;
  onCancelDraft: () => void;
  onDraftChange: (draft: PearlDraft) => void;
  onFiltersChange: (filters: PearlFilters) => void;
  onTranscriptChange: Parameters<typeof PearlReader>[0]["onTranscriptChange"];
  onUpdatePearl: (pearl: Pearl) => void;
  onPearlCreated: (pearl: Pearl) => void;
};

export function PermanenceShell({
  pearls,
  visiblePearls,
  selectedPearl,
  mode,
  draft,
  filters,
  persistenceMessage,
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
  onUpdatePearl,
  onPearlCreated,
}: PermanenceShellProps) {
  const selectedOrFirstPearl = selectedPearl ?? visiblePearls[0];
  const isCreating = mode === "new";
  const isEditing = mode === "edit";
  const userConfig = useUserConfig();
  const [homeView, setHomeView] = useState<HomeView>("canvas");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [colorMode, setColorMode] = useState<"light" | "dark">(() =>
    getConfiguredColorMode(userConfig.colorModeDefault),
  );
  const [hasLoadedStoredColorMode, setHasLoadedStoredColorMode] = useState(false);
  const persistenceHasError = /error|failed|unavailable/i.test(persistenceMessage);
  const themeToggleEnabled = userConfig.themeToggleEnabled === true;
  const themeToggleShortcut =
    typeof userConfig.themeToggleShortcut === "string" && userConfig.themeToggleShortcut
      ? userConfig.themeToggleShortcut.slice(0, 1).toLowerCase()
      : null;
  const themeToggleHotkey = themeToggleShortcut ?? "";
  const hasThemeToggleShortcut = themeToggleHotkey.length > 0;
  const themeToggleUsesIcons = userConfig.themeToggleDisplay === "icons";
  const themeToggleLabel = themeToggleUsesIcons
    ? colorMode === "light"
      ? "☾"
      : "☀"
    : colorMode === "light"
      ? "Dark Mode"
      : "Light Mode";

  useEffect(() => {
    function openSearch(event: KeyboardEvent) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      if (isTyping) {
        return;
      }

      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    }

    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (!isMounted) {
        return;
      }

      setColorMode(loadStoredColorMode(userConfig.colorModeDefault));
      setHasLoadedStoredColorMode(true);
    });

    return () => {
      isMounted = false;
    };
  }, [userConfig.colorModeDefault]);

  useEffect(() => {
    if (!hasLoadedStoredColorMode) {
      return;
    }

    document.documentElement.dataset.permanenceColorMode = colorMode;
    window.localStorage.setItem("permanence.color-mode.v1", colorMode);
  }, [colorMode, hasLoadedStoredColorMode]);

  useEffect(() => {
    function toggleColorMode(event: KeyboardEvent) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      if (isTyping || !themeToggleEnabled || !themeToggleHotkey) {
        return;
      }

      if (event.key.toLowerCase() === themeToggleHotkey) {
        event.preventDefault();
        setColorMode((current) => (current === "light" ? "dark" : "light"));
      }
    }

    window.addEventListener("keydown", toggleColorMode);
    return () => window.removeEventListener("keydown", toggleColorMode);
  }, [themeToggleEnabled, themeToggleHotkey]);

  return (
    <SacredRoot>
      <main className="mvp-shell">
        <SacredWindow
          title="Permanence"
          actions={
            <>
              {themeToggleEnabled ? (
                hasThemeToggleShortcut ? (
                  <SacredActionButton
                    aria-label={
                      colorMode === "light" ? "Switch to dark mode" : "Switch to light mode"
                    }
                    hotkey={themeToggleHotkey.toUpperCase()}
                    onClick={() =>
                      setColorMode((current) => (current === "light" ? "dark" : "light"))
                    }
                    type="button"
                  >
                    {themeToggleUsesIcons ? (
                      <span className="theme-toggle-icon" aria-hidden="true">
                        {themeToggleLabel}
                      </span>
                    ) : (
                      themeToggleLabel
                    )}
                  </SacredActionButton>
                ) : (
                  <SacredButton
                    aria-label={
                      colorMode === "light" ? "Switch to dark mode" : "Switch to light mode"
                    }
                    onClick={() =>
                      setColorMode((current) => (current === "light" ? "dark" : "light"))
                    }
                    type="button"
                  >
                    {themeToggleUsesIcons ? (
                      <span className="theme-toggle-icon" aria-hidden="true">
                        {themeToggleLabel}
                      </span>
                    ) : (
                      themeToggleLabel
                    )}
                  </SacredButton>
                )
              ) : null}
              <SacredActionButton
                hotkey={homeView === "canvas" ? "L" : "C"}
                onClick={() =>
                  setHomeView((current) => (current === "canvas" ? "list" : "canvas"))
                }
                type="button"
              >
                {homeView === "canvas" ? "List View" : "Canvas View"}
              </SacredActionButton>
              <SacredActionButton
                hotkey="K"
                onClick={() => setIsSearchOpen(true)}
                type="button"
              >
                Search
              </SacredActionButton>
              <SacredActionButton hotkey="N" onClick={onStartNewPearl} type="button">
                New Pearl
              </SacredActionButton>
            </>
          }
        >
          {isEditing ? (
            <section className="mvp-main-column">
              <PearlForm
                currentPearlId={mode === "edit" ? selectedPearl?.id : undefined}
                draft={draft}
                onCancel={onCancelDraft}
                onChange={onDraftChange}
                onSave={onSaveDraft}
                pearls={pearls}
              />
            </section>
          ) : homeView === "canvas" ? (
            <div className="canvas-view-root">
              <PearlCanvas
                onClosePearl={onClosePearl}
                onDeletePearl={onDeletePearl}
                onSelectPearl={onSelectPearl}
                onStartEditingPearl={onStartEditingPearl}
                onStartNewPearl={onStartNewPearl}
                onTranscriptChange={onTranscriptChange}
                onUpdatePearl={onUpdatePearl}
                pearls={pearls}
              />
              <IngestionPanel
                onPearlCreated={onPearlCreated}
                canvasCenter={{ x: 0, y: 0 }}
              />
            </div>
          ) : (
            <div className="mvp-grid">
              <LibraryPane
                filters={filters}
                onFiltersChange={onFiltersChange}
                onSelectPearl={onSelectPearl}
                selectedPearl={selectedOrFirstPearl}
                visiblePearls={visiblePearls}
              />

              <section className="mvp-main-column">
                {selectedOrFirstPearl ? (
                  <PearlReader
                    onClosePearl={onClosePearl}
                    onDeletePearl={onDeletePearl}
                    onEditPearl={() => onStartEditingPearl(selectedOrFirstPearl)}
                    onSelectPearl={onSelectPearl}
                    onTranscriptChange={onTranscriptChange}
                    onUpdatePearl={onUpdatePearl}
                    pearl={selectedOrFirstPearl}
                    pearls={pearls}
                  />
                ) : (
                  <SacredPanel title="No Pearls Yet">
                    <SacredEmpty title="Start with one dense encounter.">
                      Create a Pearl when an artwork, text, film, place, or fragment has
                      enough charge to deserve synthesis.
                    </SacredEmpty>
                  </SacredPanel>
                )}
              </section>
            </div>
          )}
          <span
            className={
              persistenceHasError
                ? "mvp-persistence-status mvp-persistence-status--error"
                : "mvp-persistence-status"
            }
            aria-label={persistenceMessage}
          >
            <span className="mvp-persistence-status__dot" />
            {persistenceHasError ? "Error" : "Saved locally"}
          </span>
          {isCreating ? (
            <div
              className="pearl-modal"
              role="dialog"
              aria-modal="true"
              onPointerDown={(event) => {
                if (event.currentTarget === event.target) {
                  onCancelDraft();
                }
              }}
            >
              <div
                className="pearl-modal__window"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <PearlDraftModal
                  draft={draft}
                  onCancel={onCancelDraft}
                  onChange={onDraftChange}
                  onSave={onSaveDraft}
                />
              </div>
            </div>
          ) : null}
          {isSearchOpen ? (
            <SearchModal
              filters={filters}
              onClose={() => setIsSearchOpen(false)}
              onFiltersChange={onFiltersChange}
              onSelectPearl={(id) => {
                onSelectPearl(id);
                setHomeView("list");
                setIsSearchOpen(false);
              }}
              pearls={pearls}
            />
          ) : null}
        </SacredWindow>
      </main>
      <ProgrammerPanel />
    </SacredRoot>
  );
}

function getConfiguredColorMode(configuredValue: unknown): "light" | "dark" {
  return configuredValue === "dark" ? "dark" : "light";
}

function loadStoredColorMode(configuredValue: unknown): "light" | "dark" {
  if (typeof window !== "undefined") {
    const storedColorMode = window.localStorage.getItem("permanence.color-mode.v1");

    if (storedColorMode === "dark" || storedColorMode === "light") {
      return storedColorMode;
    }
  }

  return getConfiguredColorMode(configuredValue);
}

function SearchModal({
  pearls,
  filters,
  onClose,
  onFiltersChange,
  onSelectPearl,
}: {
  pearls: Pearl[];
  filters: PearlFilters;
  onClose: () => void;
  onFiltersChange: (filters: PearlFilters) => void;
  onSelectPearl: (id: string) => void;
}) {
  const query = filters.query ?? "";
  const normalizedQuery = query.trim().toLowerCase();
  const matchingPearls = normalizedQuery
    ? pearls.filter((pearl) =>
        [
          pearl.envelope.title,
          pearl.envelope.source,
          pearl.envelope.author,
          pearl.envelope.location,
          pearl.experientialRecord,
          pearl.intellectualSynthesis,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : pearls;

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="pearl-modal pearl-modal--search"
      role="dialog"
      aria-modal="true"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <div
        className="pearl-modal__window pearl-modal__window--search"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <section className="search-popup">
          <header className="pearl-detail-card__header">
            <h2>Search</h2>
            <SacredButton onClick={onClose} type="button">
              Back
            </SacredButton>
          </header>
          <input
            autoFocus
            className="sacred-input search-popup__input"
            onChange={(event) =>
              onFiltersChange({ ...filters, query: event.currentTarget.value })
            }
            value={query}
          />
          <div className="search-popup__results">
            {matchingPearls.map((pearl) => (
              <button
                className="mvp-pearl-row"
                key={pearl.id}
                onClick={() => onSelectPearl(pearl.id)}
                type="button"
              >
                <span className="mvp-pearl-row__body">
                  <strong>{pearl.envelope.title || "Untitled Pearl"}</strong>
                  <small>{pearl.envelope.source || pearl.envelope.author}</small>
                </span>
              </button>
            ))}
            {!matchingPearls.length ? <p className="sacred-empty">No matches.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function LibraryPane({
  visiblePearls,
  selectedPearl,
  filters,
  onSelectPearl,
  onFiltersChange,
}: {
  visiblePearls: Pearl[];
  selectedPearl?: Pearl;
  filters: PearlFilters;
  onSelectPearl: (id: string) => void;
  onFiltersChange: (filters: PearlFilters) => void;
}) {
  return (
    <aside className="mvp-library">
      <div className="mvp-library__filters">
        <SacredPanel>
          <div className="mvp-filter-stack">
            <SacredField label="Search">
              <input
                className="sacred-input"
                onChange={(event) =>
                  onFiltersChange({ ...filters, query: event.currentTarget.value })
                }
                placeholder="objects that challenge authorship"
                value={filters.query ?? ""}
              />
            </SacredField>
          </div>
        </SacredPanel>
      </div>

      <SacredPanel className="mvp-library-list-panel">
        <div className="mvp-pearl-list">
          {visiblePearls.map((pearl, index) => (
            <button
              className={
                pearl.id === selectedPearl?.id
                  ? "mvp-pearl-row mvp-pearl-row--active"
                  : "mvp-pearl-row"
              }
              key={pearl.id}
              onClick={() => onSelectPearl(pearl.id)}
              type="button"
            >
              <span className="mvp-pearl-row__index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mvp-pearl-row__body">
                <strong>{pearl.envelope.title || "Untitled Pearl"}</strong>
                <small>
                  {pearl.envelope.sourceType ?? "other"} /{" "}
                  {formatDate(pearl.envelope.date || pearl.envelope.encounterDate || "")}
                </small>
              </span>
            </button>
          ))}
          {!visiblePearls.length ? (
            <SacredEmpty title="No matching Pearls.">
              Adjust the search.
            </SacredEmpty>
          ) : null}
        </div>
      </SacredPanel>
    </aside>
  );
}

