/** Pure filtering and settings logic. No file content or Obsidian runtime needed. */
export const RANGES = [
  ['1h', 1], ['6h', 6], ['1d', 24], ['3d', 72], ['1w', 168], ['1m', 720], ['All', 0],
] as const;

export const VIEW_TYPE = 'recent-changes';
export type ViewMode = 'files' | 'folders';
export interface ExcludedItem {
  kind: 'file' | 'folder';
  path: string;
}
export interface RecentChangesSettings {
  mode: ViewMode;
  hours: number;
  maxFiles: number;
  extensions: string;
  exclude: string;
  excludedItems: ExcludedItem[];
  collapsed: Record<string, boolean>;
  openOnStartup: boolean;
}
export interface FileEntry {
  path: string;
  name: string;
  basename: string;
  extension: string;
  folder: string;
  mtime: number;
}

export function defaultSettings(): RecentChangesSettings {
  return {
    mode: 'files', hours: 168, maxFiles: 200,
    extensions: 'md, canvas, base', exclude: 'node_modules/\n.venv/',
    excludedItems: [], collapsed: {}, openOnStartup: true,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeExcludedItems(value: unknown): ExcludedItem[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, ExcludedItem>();
  for (const item of value) {
    if (!isRecord(item) || (item.kind !== 'file' && item.kind !== 'folder')
      || typeof item.path !== 'string' || !item.path || item.path.startsWith('/') || item.path.endsWith('/')) continue;
    unique.set(`${item.kind}:${item.path}`, { kind: item.kind, path: item.path });
  }
  return [...unique.values()];
}

export function normalizeSettings(value: unknown): RecentChangesSettings {
  const defaults = defaultSettings();
  if (!isRecord(value)) return defaults;
  const hours = typeof value.hours === 'number' ? value.hours
    : typeof value.range === 'number' ? value.range * 24 : defaults.hours;
  return {
    mode: value.mode === 'folders' ? 'folders' : 'files',
    hours: RANGES.some((range) => range[1] === hours) ? hours : defaults.hours,
    maxFiles: typeof value.maxFiles === 'number' && Number.isFinite(value.maxFiles)
      ? Math.max(1, Math.min(5000, Math.floor(value.maxFiles))) : defaults.maxFiles,
    extensions: typeof value.extensions === 'string' ? value.extensions : defaults.extensions,
    exclude: typeof value.exclude === 'string' ? value.exclude : defaults.exclude,
    excludedItems: normalizeExcludedItems(value.excludedItems),
    collapsed: isRecord(value.collapsed)
      ? Object.fromEntries(Object.entries(value.collapsed).filter(([, collapsed]) => collapsed === true).map(([path]) => [path, true]))
      : {},
    openOnStartup: typeof value.openOnStartup === 'boolean' ? value.openOnStartup : defaults.openOnStartup,
  };
}

export function filterAndSort(files: readonly FileEntry[], settings: RecentChangesSettings): FileEntry[] {
  const extensions = new Set(settings.extensions.split(',').map((v) => v.trim().replace(/^\./, '').toLowerCase()).filter(Boolean));
  const rules = settings.exclude.split('\n').map((v) => v.trim().replace(/^\/+/, '')).filter(Boolean);
  const directories = rules.filter((v) => v.endsWith('/'));
  const names = new Set(rules.filter((v) => !v.endsWith('/')));
  return files.filter((file) => {
    if (!Number.isFinite(file.mtime)) return false;
    if (extensions.size && !extensions.has(file.extension.toLowerCase())) return false;
    if (names.has(file.name)) return false;
    if (settings.excludedItems.some((item) => item.kind === 'file'
      ? file.path === item.path : file.path.startsWith(item.path + '/'))) return false;
    return !directories.some((directory) => ('/' + file.path).includes('/' + directory));
  }).sort((a, b) => b.mtime - a.mtime || a.path.localeCompare(b.path));
}

export function selectRange(sorted: readonly FileEntry[], hours: number, limit: number, now: number): { files: FileEntry[]; total: number } {
  const cutoff = now - hours * 3600000;
  const end = hours > 0 ? sorted.findIndex((file) => file.mtime < cutoff) : -1;
  const total = end < 0 ? sorted.length : end;
  return { files: sorted.slice(0, Math.min(total, limit)), total };
}

/** Groups the already capped file list; counts describe displayed files. */
export function groupFolders(files: readonly FileEntry[]): Map<string, FileEntry[]> {
  const groups = new Map<string, FileEntry[]>();
  for (const file of files) {
    const items = groups.get(file.folder);
    if (items) items.push(file);
    else groups.set(file.folder, [file]);
  }
  return groups;
}

export function timeGroup(mtime: number, now: number): string {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (mtime >= today.getTime()) return 'Today';
  if (mtime >= yesterday.getTime()) return 'Yesterday';
  if (mtime >= now - 7 * 86400000) return 'Last 7 days';
  if (mtime >= now - 30 * 86400000) return 'Last 30 days';
  return 'Older';
}

export function shortAgo(mtime: number, now: number): string {
  const seconds = Math.max(0, (now - mtime) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 30 * 86400) return `${Math.floor(seconds / 86400)}d`;
  const date = new Date(mtime);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function fileLabel(file: FileEntry): string {
  const base = file.extension === 'md' ? file.basename : file.name;
  const parent = file.folder.split('/').pop();
  return ['index', 'README', 'CONTEXT'].includes(file.basename) && parent ? `${parent} / ${base}` : base;
}
