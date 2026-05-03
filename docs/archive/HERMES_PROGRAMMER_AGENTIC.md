# Hermes Programmer — Agentic implementation (DEPRECATED)

Status: archived on 2026-05-03.

This branch preserves the alternate Programmer experience that wired the
chat surface to the Hermes Agent CLI through a router-executor split:

- Embedded xterm.js terminal (`HermesTerminal`) connected over WebSocket to a
  `node-pty`-spawned `hermes -p programmer` shell
  (`scripts/hermes-pty-server.mjs`).
- Draggable ASCII-art launcher (`HermesLauncher`) and `HermesShell` wrapper
  mounted from `src/app/layout.tsx`.
- `/api/programmer/chat` SSE pipeline that classified each request as
  `simple`/`complex` via a router OpenRouter call, then either edited files
  directly (simple) or fell back to invoking `hermes -p programmer` over the
  CLI (complex).
- `concurrently`-driven dev script that started `next dev` and the PTY
  server together; `node-pty` `spawn-helper` permission fixup hooks in
  `package.json`.
- Workspace snapshot/rollback machinery (`src/lib/programmer/workspace-snapshot.ts`,
  `src/app/api/programmer/reset/route.ts`) and request-tier classifier
  (`src/lib/programmer/request-tier.ts`).

It is **not the active approach.** Hermes Programmer on `main` is now a
single direct OpenRouter API call: read the manifest, send the source tree,
write the returned files, return plain JSON. The agent loop was too slow
and the rollback / PTY infrastructure added more friction than benefit for
the kind of UI tweaks the Programmer is meant to handle.

Hermes Professor remains the agentic surface and continues on `main`.

To reproduce this branch's runtime, `npm install` will pull `xterm`,
`@xterm/addon-fit`, `ws`, `node-pty`, `concurrently`, `pngjs`, and
`jpeg-js`, and `npm run dev` will start both Next and the PTY WebSocket
server on `localhost:4001`.
