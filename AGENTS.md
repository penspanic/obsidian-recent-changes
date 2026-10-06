# Repository guidance

This is a public, independent Obsidian plugin distributed through GitHub releases.

- Keep the compact recent-modification navigation scope.
- Start project Markdown documents with a heading; do not add vault YAML frontmatter, which GitHub renders as a metadata table.
- Use strict TypeScript and public Obsidian APIs.
- Run `npm run check` and `npm run verify:release` before pushing changes.
- Commit source only. Never commit `dist/`, `node_modules/`, or `data.json`.
- Keep package, manifest, tag, and versions metadata consistent.
- Record real-device validation separately from mocked integration tests.
- Public publication is authorized. Submit to the Obsidian community directory only when the owner requests it.
- Do not modify an installed plugin or personal vault settings as part of a build.
- Use a `codex/` prefix for work branches and squash merges.
