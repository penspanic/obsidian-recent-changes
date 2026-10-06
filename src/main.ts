import { Notice, Plugin, TFile, debounce } from 'obsidian';
import { defaultSettings, filterAndSort, normalizeSettings, VIEW_TYPE } from './model';
import type { ExcludedItem, FileEntry, RecentChangesSettings } from './model';
import { RecentChangesView } from './view';
import { RecentChangesSettingsTab } from './settings';

export default class RecentChangesPlugin extends Plugin {
  override settings: RecentChangesSettings = defaultSettings();
  private sorted: FileEntry[] = [];
  private dirty = true;
  private saving: Promise<void> = Promise.resolve();
  private readonly scheduleRefresh = debounce(() => this.refreshViews(), 300, true);

  override async onload(): Promise<void> {
    const stored: unknown = await this.loadData();
    this.settings = normalizeSettings(stored);
    this.registerView(VIEW_TYPE, (leaf) => new RecentChangesView(leaf, this));
    this.addRibbonIcon('history', 'Recent changes', () => { void this.activate(true); });
    this.addCommand({ id: 'open', name: 'Open view', callback: () => this.activate(true) });
    this.addSettingTab(new RecentChangesSettingsTab(this.app, this));

    this.registerEvent(this.app.vault.on('modify', () => this.invalidate()));
    this.registerEvent(this.app.vault.on('create', () => this.invalidate()));
    this.registerEvent(this.app.vault.on('delete', () => this.invalidate()));
    this.registerEvent(this.app.vault.on('rename', () => this.invalidate()));
    this.registerEvent(this.app.workspace.on('file-open', () => {
      for (const view of this.views()) view.updateActiveFile();
    }));
    const refreshRevealed = (): void => {
      for (const view of this.views()) view.refreshIfNeeded();
    };
    this.registerEvent(this.app.workspace.on('active-leaf-change', refreshRevealed));
    this.registerEvent(this.app.workspace.on('layout-change', refreshRevealed));
    this.register(() => this.scheduleRefresh.cancel());
    this.registerInterval(window.setInterval(() => this.refreshViews(), 60000));
    this.app.workspace.onLayoutReady(() => {
      if (this.settings.openOnStartup) void this.activate(false);
    });
  }

  recentFiles(): readonly FileEntry[] {
    if (this.dirty) {
      this.sorted = filterAndSort(this.app.vault.getFiles().map((file) => ({
        path: file.path, name: file.name, basename: file.basename,
        extension: file.extension, folder: file.parent?.path === '/' ? '' : file.parent?.path ?? '',
        mtime: file.stat.mtime,
      })), this.settings);
      this.dirty = false;
    }
    return this.sorted;
  }

  invalidate(): void {
    this.dirty = true;
    this.scheduleRefresh();
  }

  refreshViews(): void {
    for (const view of this.views()) {
      view.requestRefresh();
    }
  }

  private views(): RecentChangesView[] {
    return this.app.workspace.getLeavesOfType(VIEW_TYPE)
      .map((leaf) => leaf.view).filter((view): view is RecentChangesView => view instanceof RecentChangesView);
  }

  saveSettings(): Promise<void> {
    // Serialize independent snapshots so rapid setting changes cannot overwrite newer ones.
    const snapshot = normalizeSettings(this.settings);
    this.saving = this.saving.catch(() => undefined).then(() => this.saveData(snapshot));
    return this.saving;
  }

  async excludeItem(item: ExcludedItem): Promise<void> {
    if (!item.path || this.settings.excludedItems.some((existing) => existing.kind === item.kind && existing.path === item.path)) return;
    const previous = this.settings.excludedItems;
    this.settings.excludedItems = [...this.settings.excludedItems, { ...item }];
    if (!await this.persistExcludedItems(previous)) return;
    new Notice('Excluded from recent changes. Restore it in settings → excluded items.');
  }

  async removeExcludedItem(item: ExcludedItem): Promise<void> {
    const previous = this.settings.excludedItems;
    this.settings.excludedItems = this.settings.excludedItems.filter((existing) => existing.kind !== item.kind || existing.path !== item.path);
    await this.persistExcludedItems(previous);
  }

  private async persistExcludedItems(previous: ExcludedItem[]): Promise<boolean> {
    let saved = true;
    try { await this.saveSettings(); }
    catch {
      this.settings.excludedItems = previous;
      saved = false;
      new Notice('Could not save exclusions. Please try again.');
    }
    this.invalidate();
    this.refreshViews();
    return saved;
  }

  async activate(reveal: boolean): Promise<void> {
    const workspace = this.app.workspace;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      const left = workspace.getLeftLeaf(false);
      if (!left) return;
      leaf = left;
      await leaf.setViewState({ type: VIEW_TYPE, active: reveal });
    }
    if (reveal) await workspace.revealLeaf(leaf);
  }

  async openFile(path: string, newTab: boolean): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    // Entries can disappear between rendering and activation (sync, rename, delete).
    if (file instanceof TFile) await this.app.workspace.getLeaf(newTab ? 'tab' : false).openFile(file);
  }
}
