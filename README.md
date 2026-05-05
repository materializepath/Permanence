# Permanence

A local-first personal creative memory system. Its central object is the **Pearl**: a structured record of a cultural encounter, the synthesis that followed, and the connections that become useful later.

Each Pearl has three layers:

1. **Envelope** — metadata (title, source/type, author, date, location)
2. **Experiential Diary** — how the encounter felt
3. **Professor Transcript** — a running dialogue with the Hermes Professor about this Pearl

## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- npm (comes with Node.js)
- (Optional, for Professor) [Hermes Agent](https://github.com/rody-png/hermes-agent) installed and available in your PATH
- (Optional, for Programmer) An [OpenRouter](https://openrouter.ai/) API key

## Install

```bash
git clone https://github.com/rody-png/Permanence.git
cd Permanence
npm install
```

## Run

```bash
npm run dev
```

Then open the local URL printed by Next.js (usually `http://localhost:3000`).

Your Pearls are stored in `.data/pearls.json` on disk and backed by `localStorage` in the browser. The `.data` directory is gitignored — your personal library never leaves your machine.

## AI Features

### Professor (Hermes Agent)

The Professor is a dedicated Hermes Agent embedded in Permanence. It reads the full context of a Pearl and responds with relevant cultural context, challenging questions, and useful connections.

**Setup:**

1. Install [Hermes Agent](https://github.com/rody-png/hermes-agent)
2. Make sure the `professor` (or `hermes`) command is available in your terminal PATH
3. The Professor will connect automatically

If Hermes is not installed, the Professor panel will show:
> "Your Hermes Agent is not set up yet. The 'professor' command was not found. Install Hermes and make sure it is available in your PATH."

The Professor requires a local Hermes Agent because it relies on persistent memory across sessions.

### Programmer (OpenRouter)

The Programmer is a direct API connection to an LLM (via OpenRouter) that can read your codebase and propose edits. It sends your source files to the model and applies the returned changes automatically.

**Setup:**

Set your OpenRouter API key in one of these ways:

- Environment variable: `OPENROUTER_API_KEY=sk-or-... npm run dev`
- Or create `~/.hermes/.env` with:
  ```
  OPENROUTER_API_KEY=sk-or-...
  OPENROUTER_MODEL=moonshotai/kimi-k2.6
  ```

The default model is `moonshotai/kimi-k2.6`. You can override it with `OPENROUTER_MODEL`.

### Threading

Threading runs a project prompt against your Pearl library and returns a briefing that surfaces the most relevant Pearls and their connective tissue.

## Architecture

```
src/app/page.tsx              — Main workspace shell
src/components/               — UI components (Canvas, Reader, Forms, Panels)
src/lib/pearls/               — Pearl domain model, storage, persistence
src/lib/professor/            — Professor adapter (Hermes Agent)
src/lib/search/               — Threading adapter
src/lib/programmer/           — Programmer route helpers
src/app/api/                  — Next.js API routes
```

- `src/lib/pearls/file-store.ts` — File-backed persistence (`.data/pearls.json`)
- `src/lib/pearls/store.ts` — Browser `localStorage` fallback
- `src/app/api/pearls/route.ts` — REST API for Pearl CRUD
- `src/app/api/professor/chat/route.ts` — Professor chat endpoint
- `src/app/api/programmer/chat/route.ts` — Programmer code-editing endpoint
- `src/app/api/thread/route.ts` — Threading briefing endpoint

## Local Data & Privacy

Permanence is local-first. Your Pearls live in `.data/pearls.json` and are never sent to any server unless you explicitly interact with the Professor or Programmer. The Professor sends Pearl context to your local Hermes Agent. The Programmer sends source code to OpenRouter for editing.

## License

MIT
