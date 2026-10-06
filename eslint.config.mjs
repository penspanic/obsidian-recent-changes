import obsidianmd from 'eslint-plugin-obsidianmd';
export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  ...obsidianmd.configs.recommended,
  { files: ['**/*.ts'], languageOptions: { parserOptions: { projectService: true } } },
  // Legacy settings rendering intentionally supports Obsidian versions before 1.13.
  { files: ['src/settings.ts'], rules: { 'obsidianmd/settings-tab/prefer-setting-definitions': 'off' } },
  // The adapter implements Obsidian's DOM helpers, so it must use native DOM constructors.
  { files: ['tests/obsidian-mock.ts'], rules: { 'obsidianmd/prefer-create-el': 'off' } },
];
