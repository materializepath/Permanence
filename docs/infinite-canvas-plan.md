# Infinite Canvas — Permanence Transformation Plan

## Vision

Transform Permanence from a pearl-library app into an **infinite canvas** where users feed content and media through different **ingestion points** that scatter across the canvas like luminous portals. Pearls become rich visual artifacts on an endless surface, with connection lines revealing the hidden topology of a user's taste and memory.

---

## Task A: Ingestion System (`src/components/canvas/`)

**New files:**
- `src/components/canvas/IngestionPanel.tsx` — Floating bottom bar with ingestion ports
- `src/components/canvas/IngestionPort.tsx` — Single port button (URL, Text, File, Bookmark)
- `src/components/canvas/UrlIngestionModal.tsx` — Modal for URL → scrape + auto-create pearl
- `src/components/canvas/QuickNoteModal.tsx` — Minimal text note → pearl
- `src/components/canvas/FileDropZone.tsx` — Drop zone overlay for file/media drag-drop

**Ingestion ports (4):**
1. **URL Port** — Paste URL → extract metadata (title, description, image) → create pearl
   - Set sourceType="website", populate envelope automatically
   - Place pearl near center of current viewport
2. **Text/Note Port** — Quick note input → creates pearl with experiential record
   - Set sourceType="other", minimal metadata
   - Place pearl near current viewport
3. **File/Media Port** — File picker or drag-drop → image/media pearl
   - Accepts images, small media files
   - Sets thumbnail from uploaded content
4. **Bookmark Port** — Shows bookmarklet instructions + creates lightweight bookmark pearls

**Data flow:**
- Each ingestion calls `createPearl()` from store with appropriate data
- Returns the created pearl + all pearls
- Fires a custom event `pearl-ingested` with the new pearl ID for the canvas to animate to

---

## Task B: Enhanced Canvas (`src/components/canvas/PearlCanvas.tsx` — replaces old)

**New file:**
- `src/components/canvas/PearlCanvas.tsx` — Enhanced version of the existing canvas

**Enhancements:**
1. **SVG Connection Lines layer** — Renders lines between connected pearls
   - SVG element positioned behind pearl nodes
   - Computes bezier curves between connected pearl positions
   - Only draws connections where `connections[]` exists between pearls
   - Animated dashed lines on hover

2. **Rich Pearl Nodes** — Enhanced `PearlNode` component showing:
   - Source type icon/indicator (🎨 exhibition, 🎬 film, 📖 book, 🌐 website, etc.)
   - Thumbnail (existing)
   - Title label below
   - Connection count badge
   - Width varies by content richness

3. **Ingestion Animations** — New pearls animate in from their ingestion point:
   - Brief scale-up + fade-in on creation
   - Canvas smoothly pans to reveal new pearl

4. **Mini-map** (stretch) — Small overview in corner showing all pearl positions

**Key constraints:**
- Preserve all existing PearlCanvas functionality (pan, zoom, drag, modal open)
- Preserve position persistence in localStorage
- Match existing Sacred design system

---

## Task C: Integration & Wiring

**Modified files:**
- `src/components/PermanenceShell.tsx` — Wire canvas view with ingestion panel
- `src/app/page.tsx` — May be minor if PermanenceShell handles it
- `src/app/globals.css` — New CSS for ingestion panel, connection lines, rich nodes

**Integration points:**
1. IngestionPanel sits at the bottom of the canvas view (not list view)
2. When `pearl-ingested` event fires, canvas pans to newly created pearl
3. Connection lines update when pearls are connected/disconnected
4. The existing "New Pearl" button still works in both views

**CSS additions (globals.css):**
- `.ingestion-panel` — Fixed bottom bar, black background, flex row of ports
- `.ingestion-port` — Styled button per port
- `.ingestion-port__icon` — Emoji/icon per port
- `.canvas-connection-line` — SVG line styles
- `.pearl-node--rich` — Enhanced node styles
- `.pearl-node__source-badge` — Source type badge
- `.pearl-node__label` — Title label below node
- `.pearl-node__connection-count` — Badge showing connection count
- `@keyframes pearl-ingest` — Animation for new pearl appearance
