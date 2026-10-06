# Validation

## Automated checks

Run `npm run check` and `npm run verify:release`.

The initial implementation passed the official Obsidian ESLint rules, strict TypeScript, 28 tests, the production build, and release metadata checks on macOS and GitHub's Ubuntu/Node 22 runner. Checks run again for every main-branch update, pull request, and release tag.

Tests cover malformed and legacy settings, isolated mutable defaults, extension and exclusion behavior, timestamp ordering, exact range cutoffs, display counts, folder grouping, cache invalidation, hidden-pane refresh, stale file entries, serialized saves, active-file highlighting, keyboard navigation, collapse state, focus retention, and the public file-menu event.

Integration tests use jsdom and a simulated Obsidian adapter. The production bundle has no runtime dependencies other than the Obsidian API provided by the app.

## Desktop smoke test — 2026-10-06

Tested on macOS with **Obsidian 1.13.7**:

- Reloaded the app with the TypeScript build installed; the sidebar loaded successfully.
- Switched between file and folder modes.
- Changed the rolling range from 6 hours to 1 hour and back; the visible list narrowed and expanded.
- Used Tab and Space to activate a range button.
- Opened a file from the sidebar.
- Upgraded the local 0.2.1 installation while preserving extension filters, excluded paths, the file limit, and collapsed folders.
- Restored the original view mode, range, and document after the smoke test.

The owner subsequently reported that the plugin appeared to work. This is a desktop smoke test, not completion of the full matrix below.

## Remaining coverage

- [ ] Disable/re-enable the plugin and restore a saved sidebar across sessions.
- [ ] Exercise every time range, empty results, and display caps in the real app.
- [ ] Create, edit, rename, and delete synthetic files outside the app.
- [ ] Verify all list keyboard controls, new-tab actions, right-click menus, folder collapse, and focus retention in the real app.
- [ ] Check light/dark themes, narrow panes, and popout windows.
- [ ] Validate a large synthetic vault and idle CPU usage.
- [ ] Smoke-test Windows and Linux.
- [ ] Test iOS and Android before enabling mobile support.

The public release is desktop-only. Mobile is not advertised as supported until device validation is recorded.
