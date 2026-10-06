import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { version } = JSON.parse(await readFile('manifest.json', 'utf8'));
const sections = (await readFile('CHANGELOG.md', 'utf8')).split(/^## /m);
const section = sections.find((entry) => entry.startsWith(`${version} — `));
assert.ok(section, `Missing changelog entry for ${version}`);
process.stdout.write(`## ${section.trim()}\n`);
