import { ItemView, Menu, TFile, setIcon } from 'obsidian';
import type { WorkspaceLeaf } from 'obsidian';
import type RecentChangesPlugin from './main';
import { fileLabel, groupFolders, RANGES, selectRange, shortAgo, timeGroup, VIEW_TYPE } from './model';
import type { FileEntry, ViewMode } from './model';

export class RecentChangesView extends ItemView {
  private needsRefresh = true;
  constructor(leaf: WorkspaceLeaf, private readonly plugin: RecentChangesPlugin) { super(leaf); }
  override getViewType(): string { return VIEW_TYPE; }
  override getDisplayText(): string { return 'Recent changes'; }
  override getIcon(): string { return 'history'; }

  override onOpen(): Promise<void> {
    this.contentEl.addClass('recent-changes-view');
    this.render();
    return Promise.resolve();
  }

  render(): void {
    this.needsRefresh = false;
    const el = this.contentEl;
    const scroll = el.scrollTop;
    const activeElement = el.ownerDocument.activeElement;
    const focused = el.contains(activeElement) ? activeElement?.getAttribute('data-rc-key') : null;
    const now = Date.now();
    const settings = this.plugin.settings;
    el.empty();

    const top = el.createDiv({ cls: 'rc-top' });
    const header = top.createDiv({ cls: 'rc-header' });
    const tabs = header.createDiv({ cls: 'rc-tabs', attr: { 'aria-label': 'Group changes by' } });
    for (const [mode, label] of [['files', 'Files'], ['folders', 'Folders']] as const) {
      const button = this.control(tabs, label, 'rc-tab', `mode:${mode}`);
      button.toggleClass('is-active', settings.mode === mode);
      button.setAttribute('aria-pressed', String(settings.mode === mode));
      button.addEventListener('click', () => { void this.changeMode(mode); });
    }
    const refresh = this.control(header, '', 'clickable-icon rc-refresh', 'refresh');
    refresh.setAttribute('aria-label', 'Refresh changes');
    setIcon(refresh, 'refresh-cw');
    refresh.addEventListener('click', () => { this.plugin.invalidate(); this.render(); });

    const ranges = top.createDiv({ cls: 'rc-ranges', attr: { 'aria-label': 'Time range' } });
    for (const [label, hours] of RANGES) {
      const button = this.control(ranges, label, 'rc-range', `range:${hours}`);
      button.toggleClass('is-active', settings.hours === hours);
      button.setAttribute('aria-pressed', String(settings.hours === hours));
      button.addEventListener('click', () => { void this.changeRange(hours); });
    }
    const { files, total } = selectRange(this.plugin.recentFiles(), settings.hours, settings.maxFiles, now);
    ranges.createSpan({ cls: 'rc-total', text: total > files.length ? `${files.length} of ${total}` : String(total) });

    const list = el.createDiv({ cls: 'rc-list', attr: { 'aria-label': 'Recently modified files' } });
    list.addEventListener('keydown', (event) => this.navigateList(event, list));
    if (files.length === 0) {
      const range = RANGES.find((item) => item[1] === settings.hours)?.[0] ?? 'this range';
      list.createDiv({ cls: 'rc-empty', text: settings.hours > 0 ? `No files changed in the last ${range}.` : 'No files to show.' });
    } else if (settings.mode === 'folders') this.renderFolders(list, files, now);
    else this.renderFiles(list, files, now);

    this.updateActiveFile();
    if (focused) {
      const button = Array.from(el.querySelectorAll<HTMLButtonElement>('button[data-rc-key]'))
        .find((item) => item.dataset.rcKey === focused);
      button?.focus({ preventScroll: true });
    }
    el.scrollTop = scroll;
  }

  requestRefresh(): void {
    this.needsRefresh = true;
    this.refreshIfNeeded();
  }

  refreshIfNeeded(): void {
    if (this.needsRefresh && this.containerEl.isShown()) this.render();
  }

  updateActiveFile(): void {
    const path = this.app.workspace.getActiveFile()?.path;
    for (const row of this.contentEl.querySelectorAll<HTMLButtonElement>('.rc-file')) {
      const active = row.dataset.rcPath === path;
      row.toggleClass('is-active', active);
      if (active) row.setAttribute('aria-current', 'page');
      else row.removeAttribute('aria-current');
    }
  }

  private control(parent: HTMLElement, label: string, cls: string, key: string): HTMLButtonElement {
    return parent.createEl('button', { text: label, cls, attr: { type: 'button', 'data-rc-key': key } });
  }

  private async changeMode(mode: ViewMode): Promise<void> {
    this.plugin.settings.mode = mode;
    await this.plugin.saveSettings();
    this.plugin.refreshViews();
  }

  private async changeRange(hours: number): Promise<void> {
    this.plugin.settings.hours = hours;
    await this.plugin.saveSettings();
    this.plugin.refreshViews();
  }

  private renderFiles(list: HTMLElement, files: FileEntry[], now: number): void {
    let bucket = '';
    for (const file of files) {
      const group = timeGroup(file.mtime, now);
      if (group !== bucket) {
        bucket = group;
        list.createDiv({ cls: 'rc-group', text: group });
      }
      this.fileRow(list, file, true, now);
    }
  }

  private renderFolders(list: HTMLElement, files: FileEntry[], now: number): void {
    for (const [path, items] of groupFolders(files)) {
      const newest = items[0];
      if (!newest) continue;
      const collapsed = this.plugin.settings.collapsed[path] === true;
      const heading = this.control(list, '', 'rc-folder', `folder:${path}`);
      heading.toggleClass('is-collapsed', collapsed);
      heading.setAttribute('aria-expanded', String(!collapsed));
      heading.setAttribute('aria-label', `${path || 'Vault root'}, ${items.length} files`);
      const chevron = heading.createSpan({ cls: 'rc-chevron', attr: { 'aria-hidden': 'true' } });
      setIcon(chevron, 'chevron-down');
      const name = heading.createDiv({ cls: 'rc-folder-name' });
      const parts = path.split('/');
      name.createSpan({ text: parts.pop() || 'Vault root' });
      if (parts.length) name.createSpan({ cls: 'rc-folder-parent', text: parts.join('/') });
      heading.createSpan({ cls: 'rc-count', text: String(items.length) });
      heading.createSpan({ cls: 'rc-time', text: shortAgo(newest.mtime, now) });
      const toggle = async (): Promise<void> => {
        if (collapsed) delete this.plugin.settings.collapsed[path];
        else this.plugin.settings.collapsed[path] = true;
        await this.plugin.saveSettings();
        this.plugin.refreshViews();
      };
      heading.addEventListener('click', () => { void toggle(); });
      heading.addEventListener('keydown', (event) => {
        if ((event.key === 'ArrowLeft' && !collapsed) || (event.key === 'ArrowRight' && collapsed)) {
          event.preventDefault(); void toggle();
        }
      });
      if (!collapsed) for (const file of items) this.fileRow(list, file, false, now).addClass('rc-nested');
    }
  }

  private fileRow(list: HTMLElement, entry: FileEntry, showFolder: boolean, now: number): HTMLButtonElement {
    const row = this.control(list, '', 'rc-file', `file:${entry.path}`);
    row.setAttribute('data-rc-path', entry.path);
    const main = row.createDiv({ cls: 'rc-file-main' });
    const title = main.createDiv({ cls: 'rc-file-name', text: fileLabel(entry) });
    if (entry.extension !== 'md') title.createSpan({ cls: 'rc-ext', text: entry.extension });
    if (showFolder && entry.folder) main.createDiv({ cls: 'rc-file-folder', text: entry.folder });
    row.createSpan({ cls: 'rc-time', text: shortAgo(entry.mtime, now) });
    const label = `${entry.path}\nModified ${new Date(entry.mtime).toLocaleString()}`;
    row.setAttribute('aria-label', label);
    row.setAttribute('data-tooltip-position', 'right');
    row.addEventListener('click', (event) => { void this.plugin.openFile(entry.path, event.metaKey || event.ctrlKey); });
    row.addEventListener('auxclick', (event) => {
      if (event.button === 1) { event.preventDefault(); void this.plugin.openFile(entry.path, true); }
    });
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault(); void this.plugin.openFile(entry.path, true);
      }
      if (event.key === 'F10' && event.shiftKey) {
        event.preventDefault(); this.fileMenu(entry, row);
      }
    });
    row.addEventListener('contextmenu', (event) => {
      event.preventDefault(); this.fileMenu(entry, row, event);
    });
    return row;
  }

  private fileMenu(entry: FileEntry, row: HTMLElement, event?: MouseEvent): void {
    const file = this.app.vault.getAbstractFileByPath(entry.path);
    if (!(file instanceof TFile)) return;
    const menu = new Menu();
    menu.addItem((item) => item.setTitle('Open in new tab').setIcon('file-plus')
      .onClick(() => this.plugin.openFile(entry.path, true)));
    // Let Obsidian and other plugins supply their native file actions through the public event.
    this.app.workspace.trigger('file-menu', menu, file, VIEW_TYPE);
    if (event) menu.showAtMouseEvent(event);
    else {
      const bounds = row.getBoundingClientRect();
      menu.showAtPosition({ x: bounds.left, y: bounds.bottom });
    }
  }

  private navigateList(event: KeyboardEvent, list: HTMLElement): void {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const buttons = Array.from(list.querySelectorAll<HTMLButtonElement>('button'));
    const index = buttons.findIndex((button) => button === list.ownerDocument.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
    buttons[target]?.focus();
  }
}
