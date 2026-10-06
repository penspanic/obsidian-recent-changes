/** Small runtime adapter for integration tests; production uses Obsidian's API. */
import { vi } from 'vitest';

type ElementOptions = { text?: string; cls?: string; attr?: Record<string, string> };
function create(parent: HTMLElement, tag: string, options: ElementOptions = {}): HTMLElement {
  const el = parent.ownerDocument.createElement(tag);
  if (options.text) el.textContent = options.text;
  if (options.cls) el.className = options.cls;
  for (const [key, value] of Object.entries(options.attr ?? {})) el.setAttribute(key, value);
  parent.appendChild(el);
  return el;
}
Object.assign(HTMLElement.prototype, {
  empty(this: HTMLElement) { this.replaceChildren(); },
  addClass(this: HTMLElement, ...classes: string[]) { this.classList.add(...classes); },
  toggleClass(this: HTMLElement, cls: string, enabled: boolean) { this.classList.toggle(cls, enabled); },
  createEl(this: HTMLElement, tag: string, options?: ElementOptions) { return create(this, tag, options); },
  createDiv(this: HTMLElement, options?: ElementOptions) { return create(this, 'div', options); },
  createSpan(this: HTMLElement, options?: ElementOptions) { return create(this, 'span', options); },
  isShown(this: HTMLElement) { return this.isConnected && !this.hidden; },
});

export class Plugin {
  settings: unknown;
  constructor(public app: unknown) {}
  loadData = vi.fn<() => Promise<unknown>>().mockResolvedValue(null);
  saveData = vi.fn<(data: unknown) => Promise<void>>().mockResolvedValue(undefined);
  registerView = vi.fn();
  addRibbonIcon = vi.fn();
  addCommand = vi.fn();
  addSettingTab = vi.fn();
  registerEvent = vi.fn();
  register = vi.fn();
  registerInterval = vi.fn();
}
export class ItemView {
  app: unknown;
  containerEl: HTMLElement;
  contentEl: HTMLElement;
  constructor(leaf: { app: unknown }) {
    this.app = leaf.app;
    this.containerEl = document.createElement('div');
    this.contentEl = create(this.containerEl, 'div');
    document.body.appendChild(this.containerEl);
  }
}
export class PluginSettingTab {}
export class Setting {}
export class TFile {
  name: string;
  basename: string;
  extension: string;
  parent: { path: string };
  stat: { mtime: number };
  constructor(public path: string, mtime: number) {
    this.name = path.split('/').pop() ?? path;
    const dot = this.name.lastIndexOf('.');
    this.basename = this.name.slice(0, dot);
    this.extension = this.name.slice(dot + 1);
    this.parent = { path: path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '/' };
    this.stat = { mtime };
  }
}
class MenuItem {
  title = '';
  action?: () => unknown;
  setTitle(title: string): this { this.title = title; return this; }
  setIcon(): this { return this; }
  onClick(action: () => unknown): this { this.action = action; return this; }
}
export class Menu {
  static instances: Menu[] = [];
  items: MenuItem[] = [];
  constructor() { Menu.instances.push(this); }
  addItem(callback: (item: MenuItem) => unknown): this {
    const item = new MenuItem(); callback(item); this.items.push(item); return this;
  }
  addSeparator(): this { return this; }
  showAtMouseEvent = vi.fn();
  showAtPosition = vi.fn();
}
export class Notice { constructor(_message: string) {} }
export function setIcon(el: HTMLElement, icon: string): void { el.dataset.icon = icon; }
export function debounce(callback: () => void, delay: number): (() => void) & { cancel: () => void } {
  let timer: number | undefined;
  const run = (): void => { window.clearTimeout(timer); timer = window.setTimeout(callback, delay); };
  run.cancel = (): void => { window.clearTimeout(timer); };
  return run;
}
