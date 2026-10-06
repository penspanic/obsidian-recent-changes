# Changelog

## 0.4.0 — 2026-10-06

- Exclude a selected file or folder directly from the Recent Changes context menu.
- Exclude a file's parent folder without switching to folder view.
- Match sidebar exclusions by exact vault path so same-named items in other folders stay visible.
- Restore excluded items from Settings → Recent Changes → Excluded items → Remove.
- Preserve existing manual exclusion rules and recover the visible list if saving an exclusion fails.

## 0.3.1 — 2026-10-06

First public release.

- Document BRAT installation, manual installation and updates, local builds, and contribution/support paths.
- Remove vault-specific metadata tables from project documentation.
- Record the completed macOS desktop smoke test and limit this release to desktop until mobile validation is available.
- Update CI actions to supported runtimes and generate release notes for the tagged version.

## 0.3.0 — 2026-10-06

Initial TypeScript implementation based on the local 0.2.1 plugin.

- Move the implementation to strict TypeScript with separate model, view, settings, and lifecycle modules.
- Keep time filters, file/folder modes, extension exclusions, relative times, and new-tab actions.
- Use general-purpose defaults without private workspace paths.
- Cache the filtered/sorted index until vault metadata or filters change.
- Skip scheduled rendering for hidden panes; update active-file styling without rebuilding the list.
- Add native button semantics, list keyboard navigation, focus preservation, and accessible state labels.
- Validate stored settings and serialize independent save snapshots.
- Use the public file-menu event instead of accessing Obsidian's private file explorer implementation. The previous custom folder/file reveal action is no longer provided; native file menu actions are supplied by the host and other plugins.
- Add automated checks, CI, draft release automation, installation instructions, and an MIT license.
