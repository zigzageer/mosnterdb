import { build } from 'vite';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
await build({ root, build: { outDir: 'docs' } });
await writeFile(new URL('../docs/.nojekyll', import.meta.url), '');
console.log('GitHub Pages build ready in docs/. Publish main /docs in repository Settings → Pages.');
