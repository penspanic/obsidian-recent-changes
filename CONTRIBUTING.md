---
type: documentation
date: 2026-10-06
tags: [obsidian, recent-changes]
---

# Contributing

Recent Changes focuses on fast navigation through recent modifications in a compact sidebar. Keep new features consistent with that scope.

## Setup and checks

```sh
npm ci
npm run check
npm run verify:release
```

- `src/model.ts`: settings normalization, filtering, sorting, time ranges, grouping.
- `src/main.ts`: Obsidian lifecycle, cached index, serialized settings persistence.
- `src/view.ts`: sidebar rendering, keyboard controls, context menus.
- `src/settings.ts`: configuration UI.
- `tests/`: pure behavior tests and integration tests against a minimal simulated host.

Use strict TypeScript and the public Obsidian API. Avoid reading note contents when metadata is enough. Preserve keyboard focus and scroll position when refreshing. Do not commit generated files or personal vault settings.

Add a regression test when changing filters, settings migration, cache invalidation, or interaction behavior. Run a desktop smoke test for UI changes and record what was tested. Use synthetic notes when sharing reproduction steps.

## Pull requests

Describe the problem, the resulting behavior, and how you verified it. Keep changes small. The repository uses squash merges and deletes merged remote branches.
