# Champagne Design Archive

Archived on 2026-04-28 before restarting the visual direction for Permanence.

## Git References

- Branch: `archive/champagne-design`
- Tag: `archive/champagne-design-2026-04-28`
- Baseline commit: `Archive spatial prototype baseline.`

To inspect the archived state:

```bash
git switch archive/champagne-design
```

To return to active redesign work:

```bash
git switch main
```

## What Was Preserved

The archive captures the current local-first Next prototype:

- A Pearl domain model with envelope metadata, experiential record, intellectual synthesis, Professor transcript, connections, and attachments.
- Browser-local persistence through `src/lib/pearls/store.ts`.
- Seed data and local text/tag filtering.
- Mock Professor and threading adapters that demonstrate intended flows without external services.
- The archived "champagne" design: a spatial pearl-table interface and glassy memory aesthetic.

## What Future Agents Should Keep

Future implementation work should preserve the product concept in `permanence-pitch.md` and the useful backend boundaries:

- `src/lib/pearls/types.ts` for the domain model.
- `src/lib/pearls/store.ts` for the persistence boundary.
- `src/lib/professor/adapter.ts` for Professor integration.
- `src/lib/search/adapter.ts` for semantic search and threading.

## What Future Agents Should Not Assume

The archived champagne aesthetic, including the spatial/glass/pearl-table interface, is not the continuing direction. Treat it as a saved prototype, not a design system. Redesign work can replace the layout, navigation, visual language, and interaction patterns while keeping the Pearl concept and local-first architecture in mind.
