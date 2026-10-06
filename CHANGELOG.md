---
type: documentation
date: 2026-10-06
tags: [obsidian, recent-changes]
---

# Changelog

## 0.3.0 — 2026-10-06

Private review build based on the author's local 0.2.1 plugin.

- Move the implementation to strict TypeScript with separate model, view, settings, and lifecycle modules.
- Keep time filters, file/folder modes, extension exclusions, relative times, and new-tab actions.
- Use general-purpose defaults without private workspace paths.
- Cache the filtered/sorted index until vault metadata or filters change.
- Skip scheduled rendering for hidden panes; update active-file styling without rebuilding the list.
- Add native button semantics, list keyboard navigation, focus preservation, and accessible state labels.
- Validate stored settings and serialize independent save snapshots.
- Use the public file-menu event instead of accessing Obsidian's private file explorer implementation. The previous custom folder/file reveal action is no longer provided; native file menu actions are supplied by the host and other plugins.
- Add automated checks, CI, draft release automation, installation instructions, and an MIT license.
