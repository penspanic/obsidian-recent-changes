---
type: documentation
date: 2026-10-06
tags: [obsidian, recent-changes]
---

# Validation

## Automated

Run `npm run check` and `npm run verify:release`.

Tests cover malformed and legacy settings, isolated mutable defaults, extension and exclusion behavior, timestamp ordering, exact range cutoffs, display counts, folder grouping, cache invalidation, hidden-pane refresh, stale file entries, serialized saves, active-file highlighting, keyboard navigation, collapse state, focus retention, and the public file-menu event.

Integration tests run with jsdom and a small Obsidian adapter. They check interaction and lifecycle contracts, not the real Obsidian renderer. The build bundles no runtime dependencies; `obsidian` is provided by the host app.

## Device checks before public release

- [ ] Desktop Obsidian: enable/disable/re-enable the plugin; open and restore the sidebar.
- [ ] Switch every time range and file/folder mode; check empty and capped results.
- [ ] Create, edit, rename, and delete a synthetic file outside the app; check that detection updates the list.
- [ ] Verify keyboard navigation, new-tab actions, right-click menu, folder collapse, and focus retention.
- [ ] Check light/dark themes, narrow panes, and a popout window.
- [ ] Upgrade a test copy of 0.2.1 with personalized `data.json`; confirm filters remain intact.
- [ ] Validate a large synthetic vault and check idle CPU usage.
- [ ] Check iOS and Android layout, touch actions, and sidebar restoration.

Device checks are pending unless a result is explicitly recorded below. The existing personal-vault plugin is not automatically replaced by this project.
