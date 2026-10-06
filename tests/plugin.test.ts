import { afterEach, describe, expect, it, vi } from 'vitest';
import type { App, PluginManifest, WorkspaceLeaf } from 'obsidian';
import RecentChangesPlugin from '../src/main';
import { RecentChangesView } from '../src/view';
import { TFile } from './obsidian-mock';

function setup() {
  const files = [new TFile('Project/one.md', Date.now()), new TFile('Other/two.md', Date.now() - 1000)];
  let active: TFile | null = files[0] ?? null;
  const leaves: { view: RecentChangesView }[] = [];
  const open = vi.fn().mockResolvedValue(undefined);
  const handlers = new Map<string, () => void>();
  const app = {
    vault: {
      getFiles: vi.fn(() => files),
      getAbstractFileByPath: vi.fn((path: string) => files.find((file) => file.path === path) ?? null),
      on: vi.fn((event: string, handler: () => void) => { handlers.set(event, handler); return {}; }),
    },
    workspace: {
      getLeavesOfType: vi.fn((type: string) => type === 'recent-changes' ? leaves : []),
      getActiveFile: vi.fn(() => active), getLeaf: vi.fn(() => ({ openFile: open })),
      on: vi.fn((event: string, handler: () => void) => { handlers.set(event, handler); return {}; }),
      onLayoutReady: vi.fn(), trigger: vi.fn(),
    },
  };
  const plugin = new RecentChangesPlugin(app as unknown as App, {} as PluginManifest);
  const view = new RecentChangesView({ app } as unknown as WorkspaceLeaf, plugin);
  leaves.push({ view });
  return { app, plugin, view, files, open, handlers, setActive: (file: TFile) => { active = file; } };
}

afterEach(() => { vi.useRealTimers(); document.body.replaceChildren(); });

describe('plugin integration in a simulated Obsidian host', () => {
  it('reuses the index and invalidates it for external modify/create/delete/rename events', async () => {
    vi.useFakeTimers();
    const { plugin, app, handlers, files, view } = setup();
    await plugin.onload(); view.render();
    const first = plugin.recentFiles();
    plugin.recentFiles(); plugin.refreshViews();
    expect(app.vault.getFiles).toHaveBeenCalledTimes(1);
    files.push(new TFile('External/new.md', Date.now() + 10));
    handlers.get('create')?.();
    await vi.advanceTimersByTimeAsync(300);
    expect(plugin.recentFiles()).not.toBe(first);
    expect(view.contentEl.querySelectorAll('.rc-file')).toHaveLength(3);
    for (const event of ['modify', 'delete', 'rename']) {
      handlers.get(event)?.(); await vi.advanceTimersByTimeAsync(300);
    }
    expect(app.vault.getFiles).toHaveBeenCalledTimes(5);
  });
  it('does no scans on the minute timer when its pane is hidden', async () => {
    vi.useFakeTimers();
    const { plugin, app, view, handlers } = setup();
    await plugin.onload(); view.render(); view.containerEl.hidden = true;
    handlers.get('modify')?.();
    await vi.advanceTimersByTimeAsync(120000);
    expect(app.vault.getFiles).toHaveBeenCalledTimes(1);
    view.containerEl.hidden = false; handlers.get('layout-change')?.();
    expect(app.vault.getFiles).toHaveBeenCalledTimes(2);
  });
  it('updates the active indicator without rebuilding or stealing focus', async () => {
    const { plugin, view, files, setActive, handlers, app } = setup();
    await plugin.onload(); view.render();
    const first = view.contentEl.querySelector<HTMLButtonElement>('.rc-file');
    first?.focus();
    const next = files[1]; if (next) setActive(next);
    handlers.get('file-open')?.();
    expect(view.contentEl.querySelector('.rc-file')).toBe(first);
    expect(document.activeElement).toBe(first);
    expect(view.contentEl.querySelector('.rc-file.is-active')?.getAttribute('data-rc-path')).toBe('Other/two.md');
    expect(app.vault.getFiles).toHaveBeenCalledTimes(1);
  });
  it('supports arrow navigation, modified Enter, and focus preservation after refresh', () => {
    const { view, app, open } = setup(); view.render();
    const rows = view.contentEl.querySelectorAll<HTMLButtonElement>('.rc-file');
    rows[0]?.focus();
    rows[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(rows[1]);
    rows[1]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
    expect(app.workspace.getLeaf).toHaveBeenCalledWith('tab');
    expect(open).toHaveBeenCalledTimes(1);
    view.contentEl.scrollTop = 40;
    view.render();
    expect(document.activeElement?.getAttribute('data-rc-path')).toBe('Other/two.md');
    expect(view.contentEl.scrollTop).toBe(40);
  });
  it('uses native buttons for accessible file/folder activation and collapse', async () => {
    const { plugin, view } = setup();
    plugin.settings.mode = 'folders'; view.render();
    const heading = view.contentEl.querySelector<HTMLButtonElement>('.rc-folder');
    expect(heading?.tagName).toBe('BUTTON');
    expect(heading?.getAttribute('aria-expanded')).toBe('true');
    heading?.focus();
    heading?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await vi.waitFor(() => expect(plugin.settings.collapsed.Project).toBe(true));
    await vi.waitFor(() => expect(view.contentEl.querySelector('.rc-folder')?.getAttribute('aria-expanded')).toBe('false'));
    expect(document.activeElement?.getAttribute('data-rc-key')).toBe('folder:Project');
  });
  it('does not open a stale file or a folder as a file', async () => {
    const { plugin, app, open } = setup();
    await plugin.openFile('deleted.md', false);
    app.vault.getAbstractFileByPath.mockReturnValueOnce(Object.assign({}, new TFile('folder', 0)));
    await plugin.openFile('folder', false);
    expect(open).not.toHaveBeenCalled();
  });
  it('reflects renames and deletions without keeping stale rows', () => {
    vi.useFakeTimers();
    const { plugin, view, files } = setup(); view.render();
    files.splice(0, 1, new TFile('Renamed/note.md', Date.now()));
    plugin.invalidate(); view.render();
    expect(view.contentEl.querySelector('[data-rc-path="Project/one.md"]')).toBeNull();
    expect(view.contentEl.querySelector('[data-rc-path="Renamed/note.md"]')).not.toBeNull();
    files.length = 0; plugin.invalidate(); view.render();
    expect(view.contentEl.querySelector('.rc-empty')?.textContent).toContain('No files changed');
  });
  it('serializes settings snapshots and recovers the queue after a failed save', async () => {
    const { plugin } = setup();
    const save = vi.spyOn(plugin, 'saveData').mockRejectedValueOnce(new Error('disk full'));
    plugin.settings.collapsed.Project = true;
    const first = plugin.saveSettings().catch(() => undefined);
    plugin.settings.collapsed.Project = false; plugin.settings.hours = 24;
    const second = plugin.saveSettings();
    await first; await second;
    expect(save.mock.calls[0]?.[0]).toMatchObject({ hours: 168, collapsed: { Project: true } });
    expect(save.mock.calls[1]?.[0]).toMatchObject({ hours: 24, collapsed: {} });
  });
  it('uses the public file-menu event for context actions', () => {
    const { view, app } = setup(); view.render();
    view.contentEl.querySelector('.rc-file')?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
    expect(app.workspace.trigger).toHaveBeenCalledWith('file-menu', expect.anything(), expect.any(TFile), 'recent-changes');
  });
});
