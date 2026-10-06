import { context } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';
const watch = process.argv.includes('--watch');
await mkdir('dist', { recursive: true });
for (const file of ['manifest.json', 'styles.css']) await copyFile(file, `dist/${file}`);
const build = await context({
  entryPoints: ['src/main.ts'], bundle: true, external: ['obsidian'],
  format: 'cjs', target: 'es2018', platform: 'browser', outfile: 'dist/main.js',
  sourcemap: watch ? 'inline' : false, minify: false,
  banner: { js: '/* Recent Changes | MIT License | https://github.com/penspanic/obsidian-recent-changes */' },
});
if (watch) await build.watch();
else { await build.rebuild(); await build.dispose(); }
