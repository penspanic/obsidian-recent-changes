---
type: documentation
date: 2026-10-06
tags: [obsidian, recent-changes]
---

# Repository guidance

This is an independent Obsidian plugin, kept private during owner review.

- Keep the compact recent-modification navigation scope.
- Use strict TypeScript and public Obsidian APIs.
- Run `npm run check` and `npm run verify:release` before pushing changes.
- Commit source only. Never commit `dist/`, `node_modules/`, or `data.json`.
- Keep package, manifest, tag, and versions metadata consistent.
- Record real-device validation separately from mocked integration tests.
- Do not make the repository public or submit it to the community directory without explicit owner approval.
- Do not modify an installed plugin or personal vault settings as part of a build.
- Use a `codex/` prefix for work branches and squash merges.
