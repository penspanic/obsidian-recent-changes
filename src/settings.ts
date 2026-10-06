import { PluginSettingTab, Setting } from 'obsidian';
import type { App } from 'obsidian';
import type RecentChangesPlugin from './main';

export class RecentChangesSettingsTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: RecentChangesPlugin) { super(app, plugin); }

  override display(): void {
    this.renderSettings();
  }

  private renderSettings(): void {
    const container = this.containerEl;
    const settings = this.plugin.settings;
    container.empty();
    const save = async (refilter = false): Promise<void> => {
      await this.plugin.saveSettings();
      if (refilter) this.plugin.invalidate();
      else this.plugin.refreshViews();
    };
    new Setting(container).setName('Open sidebar on startup')
      .setDesc('Create the sidebar after the workspace loads. Existing saved panes are kept.')
      .addToggle((toggle) => toggle.setValue(settings.openOnStartup).onChange(async (value) => {
        settings.openOnStartup = value; await save();
      }));
    new Setting(container).setName('Maximum files')
      .setDesc('Display 1–5,000 files. Folder counts include displayed files only.')
      .addText((text) => text.setValue(String(settings.maxFiles)).onChange(async (value) => {
        const count = Number(value);
        const valid = value.trim() !== '' && Number.isInteger(count) && count >= 1 && count <= 5000;
        text.inputEl.setAttribute('aria-invalid', String(!valid));
        if (valid) { settings.maxFiles = count; await save(); }
      }));
    new Setting(container).setName('Extensions')
      .setDesc('Comma-separated extensions, such as md, canvas, base. Leave empty for all files.')
      .addText((text) => text.setValue(settings.extensions).onChange(async (value) => {
        settings.extensions = value; await save(true);
      }));
    new Setting(container).setName('Exclude')
      .setDesc('One case-sensitive rule per line. Folder rules end in / and match at any depth. Other rules match an exact filename.')
      .addTextArea((text) => {
        text.inputEl.rows = 8;
        text.inputEl.addClass('rc-exclude-input');
        text.setValue(settings.exclude).onChange(async (value) => { settings.exclude = value; await save(true); });
      });
    new Setting(container).setName('Excluded items').setHeading()
      .setDesc('Exact files and folders hidden from the sidebar menu. Remove an item to show it again; manual exclude rules still apply.');
    for (const item of settings.excludedItems) {
      new Setting(container).setName(item.path)
        .setDesc(item.kind === 'folder' ? 'Folder and its descendants' : 'File')
        .addButton((button) => button.setButtonText('Remove').onClick(async () => {
          await this.plugin.removeExcludedItem(item);
          this.renderSettings();
        }));
    }
  }
}
