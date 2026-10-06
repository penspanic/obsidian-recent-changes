---
type: documentation
date: 2026-10-06
tags: [obsidian, recent-changes]
---

# Recent Changes

A compact Obsidian sidebar for finding recently modified files and folders.

Pick a time range, switch between files and folders, and return to the work that just changed. This is useful when your vault is also edited by external editors, scripts, AI agents, or Git.

## Features

- One-click ranges: 1 hour, 6 hours, 1 day, 3 days, 1 week, 30 days, or all files.
- File view grouped by time, or folder view ordered by each folder's latest change.
- Configurable extensions, excluded folders and filenames, and a display limit.
- Relative modification times, active-file highlighting, and folder context for generic names such as `README` and `index`.
- Open in the current pane, a new tab with Ctrl/Cmd-click, or a new tab with middle-click.
- Keyboard navigation and native file context menus.
- No runtime network requests, telemetry, accounts, or other plugin dependencies.

## Status

Version **0.3.0** is a private review build. This project has not been submitted to the Obsidian community directory. The source and release assets remain private until the owner chooses to publish them.

The API declaration supports mobile, but device testing on iOS and Android is still pending. Automated integration tests use a simulated Obsidian host; they do not replace testing in the desktop app. See [validation](docs/VALIDATION.md).

## Installation

### Review build / manual installation

1. While signed in to GitHub with repository access, download `main.js`, `manifest.json`, and `styles.css` from the [release page](https://github.com/penspanic/obsidian-recent-changes/releases). A draft release is visible to users with appropriate repository permissions.
2. Create `<vault>/<config-dir>/plugins/recent-changes/`. The default config directory is `.obsidian`.
3. Put the three files in that folder. Do not copy `src/`, `node_modules/`, or someone else's `data.json`.
4. Restart Obsidian, allow community plugins, and enable **Recent Changes** under Settings → Community plugins.
5. Click the history ribbon icon or run **Recent Changes: Open view**.

You can also build the files locally with the development instructions below.

### After public release

Before community-directory approval, [BRAT](https://github.com/TfTHacker/obsidian42-brat) can install a published GitHub release by repository URL. Private repositories require authenticated access; pasting a private URL alone does not make it accessible.

After approval, install through Obsidian's community plugin browser.

## Usage

Choose **Files** to scan individual changes, or **Folders** to see which folders have recent activity. Collapse a folder to reduce clutter. The last mode, range, and collapsed folders are saved per vault.

The count shows matching files before the display limit, for example `200 of 350`. Folder counts include only displayed files.

### Keyboard

- **Tab / Shift+Tab**: move between controls and entries.
- **↑ / ↓**, **Home / End**: move through the file and folder list.
- **Enter / Space**: activate a focused button.
- **Ctrl/Cmd+Enter** on a file: open in a new tab.
- **← / →** on a folder: collapse / expand.
- **Shift+F10** on a file: open the context menu.

### Settings

| Setting | Default | Meaning |
| --- | --- | --- |
| Open sidebar on startup | On | Create the sidebar after the workspace loads. Saved panes are retained. |
| Maximum files | 200 | Display at most 1–5,000 files. |
| Extensions | `md, canvas, base` | Comma-separated extensions. Empty means all file types. |
| Exclude | `node_modules/`, `.venv/` | One case-sensitive rule per line. |

A folder rule ends in `/` and matches at any depth: `Archive/` excludes both `Archive/a.md` and `Project/Archive/a.md`, but not `Archived/a.md`. A nested rule such as `Project/Generated/` matches that folder sequence. A rule without `/` at the end matches an exact filename anywhere in the vault: `README.md` excludes that name, not `MyREADME.md`. Exclusions are literal rules, not glob patterns or regular expressions.

Upgrading the earlier local plugin with the same `recent-changes` ID preserves its stored filters and collapsed folders. New installs receive general-purpose defaults; existing personalized exclusions are not removed automatically.

## What counts as a change?

The list uses the modification time reported by Obsidian, **not the time a file was last opened**. External edits appear once Obsidian detects them. Git checkouts, synchronization, and imports can update timestamps, so this is a navigation aid rather than an audit log. It does not record historical edits, deleted files, diffs, or the author of a change.

Time ranges are rolling durations; `1m` means 30 days. Today/Yesterday headings use the local calendar. Extension filtering and exclusions happen before the display cap.

## Development

Requires Node.js 22 or newer and npm.

```sh
npm ci
npm run check
npm run verify:release
```

The installable files are in `dist/`. Only source files are committed; builds and local plugin settings are ignored.

```sh
npm run dev
```

Watch mode rebuilds JavaScript. After changing `styles.css` or `manifest.json`, restart the watcher to recopy those assets. Copy the three `dist/` files into a test vault's plugin directory and reload the plugin. Running a build does not modify your installed plugin.

See [contributing](CONTRIBUTING.md), [release steps](docs/RELEASING.md), and [validation](docs/VALIDATION.md).

## License

[MIT](LICENSE), copyright 2026 penspanic. This is an independent community plugin, not an official Obsidian product.
