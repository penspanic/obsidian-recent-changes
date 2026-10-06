import { describe, expect, it } from 'vitest';
import { defaultSettings, fileLabel, filterAndSort, groupFolders, normalizeSettings, selectRange, shortAgo, timeGroup } from '../src/model';
import type { FileEntry } from '../src/model';

export function entry(path: string, mtime: number): FileEntry {
  const name = path.split('/').pop() ?? path;
  const dot = name.lastIndexOf('.');
  return { path, name, basename: dot < 0 ? name : name.slice(0, dot), extension: dot < 0 ? '' : name.slice(dot + 1), folder: path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '', mtime };
}

describe('settings and migration', () => {
  it.each([null, undefined, 'broken', [], 7])('recovers malformed stored settings: %s', (value) => {
    expect(normalizeSettings(value)).toEqual(defaultSettings());
  });
  it('preserves personal filters on upgrade and ignores unknown keys', () => {
    const settings = normalizeSettings({ exclude: 'Archive/\nCONTEXT.md', hours: 24, mode: 'folders', maxFiles: 10, range: 7, extra: 'unused' });
    expect(settings).toMatchObject({ exclude: 'Archive/\nCONTEXT.md', hours: 24, mode: 'folders', maxFiles: 10 });
    expect(settings).not.toHaveProperty('range');
    expect(settings).not.toHaveProperty('extra');
  });
  it('migrates older day ranges and rejects unsupported ranges', () => {
    expect(normalizeSettings({ range: 7 }).hours).toBe(168);
    expect(normalizeSettings({ hours: -1 }).hours).toBe(168);
  });
  it('validates file limits, modes, booleans and collapsed folders', () => {
    expect(normalizeSettings({ maxFiles: Infinity, mode: 'bad', openOnStartup: 'yes', collapsed: { a: true, b: false, c: 'true' } })).toMatchObject({ maxFiles: 200, mode: 'files', openOnStartup: true, collapsed: { a: true } });
    expect(normalizeSettings({ maxFiles: -10 }).maxFiles).toBe(1);
    expect(normalizeSettings({ maxFiles: 9000 }).maxFiles).toBe(5000);
  });
  it('never shares mutable defaults or loaded state', () => {
    const stored = { collapsed: { a: true } };
    const a = normalizeSettings(stored);
    a.collapsed.b = true;
    expect(normalizeSettings(stored).collapsed).toEqual({ a: true });
    defaultSettings().collapsed.a = true;
    expect(defaultSettings().collapsed).toEqual({});
  });
});

describe('file filtering', () => {
  it('sorts by modification time, with stable path order on ties', () => {
    const files = [entry('b.md', 20), entry('c.md', 30), entry('a.md', 20)];
    expect(filterAndSort(files, defaultSettings()).map((file) => file.path)).toEqual(['c.md', 'a.md', 'b.md']);
    expect(files[0]?.path).toBe('b.md');
  });
  it('matches folders at any depth without hiding similarly named folders', () => {
    const settings = { ...defaultSettings(), exclude: ' /Archive/ \nREADME.md' };
    const paths = ['Archive/a.md', 'Work/Archive/a.md', 'Work/Archived/a.md', 'Work/README.md', 'Work/MyREADME.md'];
    expect(filterAndSort(paths.map((path) => entry(path, 1)), settings).map((file) => file.path)).toEqual(['Work/Archived/a.md', 'Work/MyREADME.md']);
  });
  it('supports nested directory rules, not partial path matches', () => {
    const settings = { ...defaultSettings(), exclude: 'Work/Generated/' };
    const paths = ['Work/Generated/a.md', 'Team/Work/Generated/a.md', 'OtherWork/Generated/a.md'];
    expect(filterAndSort(paths.map((path) => entry(path, 1)), settings).map((file) => file.path)).toEqual(['OtherWork/Generated/a.md']);
  });
  it('normalizes extensions and supports all-file mode', () => {
    const files = [entry('a.MD', 1), entry('b.pdf', 2), entry('c.canvas', 3)];
    expect(filterAndSort(files, { ...defaultSettings(), extensions: ' .md, CANVAS ' })).toHaveLength(2);
    expect(filterAndSort(files, { ...defaultSettings(), extensions: '' })).toHaveLength(3);
  });
  it('keeps ordinary project notes visible by default', () => {
    expect(filterAndSort([entry('Project/CONTEXT.md', 1), entry('tmp/note.md', 1)], defaultSettings())).toHaveLength(2);
  });
  it('skips invalid timestamps', () => {
    expect(filterAndSort([entry('bad.md', NaN), entry('ok.md', 1)], defaultSettings())).toHaveLength(1);
  });
});

describe('range and grouping', () => {
  it('includes the exact cutoff, excludes older files, and reports total before cap', () => {
    const files = [entry('new.md', 7200000), entry('edge.md', 3600000), entry('old.md', 3599999)];
    expect(selectRange(files, 1, 1, 7200000)).toEqual({ files: [files[0]], total: 2 });
    expect(selectRange(files, 1, 5, 7200000).files).toHaveLength(2);
    expect(selectRange(files, 0, 5, 7200000).files).toHaveLength(3);
  });
  it('returns an empty selection when no file is in range', () => {
    expect(selectRange([entry('old.md', 0)], 1, 200, 7200000)).toEqual({ files: [], total: 0 });
  });
  it('orders folders by their newest visible file and retains distinct paths', () => {
    const files = [entry('A/Notes/new.md', 3), entry('B/Notes/new.md', 2), entry('root.md', 1), entry('A/Notes/old.md', 0)];
    const groups = groupFolders(files);
    expect([...groups.keys()]).toEqual(['A/Notes', 'B/Notes', '']);
    expect(groups.get('A/Notes')).toHaveLength(2);
  });
  it('distinguishes generic file names and uses local calendar boundaries', () => {
    expect(fileLabel(entry('Project/README.md', 0))).toBe('Project / README');
    expect(fileLabel(entry('README.md', 0))).toBe('README');
    const now = new Date(2026, 9, 6, 12).getTime();
    expect(timeGroup(new Date(2026, 9, 6, 0).getTime(), now)).toBe('Today');
    expect(timeGroup(new Date(2026, 9, 5, 0).getTime(), now)).toBe('Yesterday');
    expect(timeGroup(now - 4 * 86400000, now)).toBe('Last 7 days');
    expect(shortAgo(now + 1000, now)).toBe('now');
  });
});
