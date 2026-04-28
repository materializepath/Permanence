# Permanence

Permanence is a local-first prototype for a personal creative memory system. Its central object is the Pearl: a structured record of an encounter, the synthesis that followed, and the connections that become useful later.

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Next.js.

## What Works

- Browse a seeded Pearl library.
- Create and edit Pearls.
- Capture envelope metadata, experiential record, intellectual synthesis, Professor transcript, and annotated connections.
- Search and filter locally by text, source type, and tag.
- Ask a mock Professor question and save the response into the Pearl transcript.
- Generate a mock threading brief from a project prompt.

## Main Editable Areas

```text
src/app/page.tsx                  # Main local app workspace
src/components/                   # Small product-facing UI components
src/lib/pearls/types.ts           # Pearl domain model
src/lib/pearls/store.ts           # Local persistence and CRUD boundary
src/lib/professor/adapter.ts      # Mock Professor adapter
src/lib/search/adapter.ts         # Mock threading/search adapter
src/lib/pearls/seed.ts            # Starter Pearls
```

## Local Data

The prototype stores Pearls in `localStorage` under `permanence.pearls.v1`. This keeps the first version simple and private to your computer. The storage functions are isolated in `src/lib/pearls/store.ts` so a later SQLite, file-backed, or hosted database implementation can replace them.

To reset the seeded data, clear that localStorage key in your browser dev tools and refresh.

## Intentionally Mocked

The Professor and threading flows are real UI paths with mock adapters. That means the app demonstrates the desired workflow without requiring OpenRouter, Hermes, embeddings, or vector search yet.

Later replacements should start at:

- `src/lib/professor/adapter.ts` for OpenRouter/Hermes-backed Professor sessions.
- `src/lib/search/adapter.ts` for semantic retrieval and generated project briefings.
- `src/lib/pearls/store.ts` for durable database or file-backed persistence.
