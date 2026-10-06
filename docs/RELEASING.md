# Releasing

The public repository distributes installable files through GitHub releases. BRAT and manual installs work before the plugin is listed in Obsidian's community directory.

## Prepare a version

1. Update `version` in `package.json` and `manifest.json` together.
2. Add that version to `versions.json`, with the minimum compatible Obsidian version.
3. Run `npm install --package-lock-only` to refresh package metadata.
4. Add a matching version section to `CHANGELOG.md` and record device validation.
5. Run `npm run check` and `npm run verify:release`.
6. Commit and push the source, then push a matching version tag without a `v` prefix (for example `0.3.1`).

The tag workflow checks the source and creates a draft release with `main.js`, `manifest.json`, and `styles.css`. It extracts only that version's changelog entry for the release notes. Inspect the assets, then publish the draft as a normal release so it is available to BRAT and at the latest-release link.

The workflow rejects a tag that does not match the manifest version. Release assets are generated from tagged source and are not committed. Draft releases are not an installation channel.

## Community-directory submission

GitHub publication and community-directory listing are separate steps. The [Recent Changes listing](https://community.obsidian.md/plugins/recent-changes) was submitted and published on 2026-10-06 under `penspanic`. The initial automated review was pending at publication; directory installation becomes available after the review requirements are satisfied.

For listing maintenance:

1. Check the current [developer policies](https://docs.obsidian.md/community-directory/developer-policies) and [submission requirements](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins).
2. Keep the existing `recent-changes` ID and keep `isDesktopOnly` aligned with tested support. The current public release is desktop-only.
3. Sign in at [community.obsidian.md](https://community.obsidian.md), open Plugins → Recent Changes, and address review feedback. Publish a new version when changing release assets; documentation-only changes do not require a new plugin version. Follow the [official submission guide](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin) for the current review workflow.

The manifest on the default branch and the GitHub release tag must agree. After initial approval, users can install and update through Obsidian's community plugin browser.
