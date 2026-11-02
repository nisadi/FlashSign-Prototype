// Keeps public/pdf.worker.min.mjs in step with the installed pdfjs-dist (same as Flash Sign).
// pdf.js refuses to load a document when the main-thread API and the worker build differ,
// so the copy is refreshed on every install.
import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const src = join(dirname(require.resolve('pdfjs-dist/package.json')), 'legacy/build/pdf.worker.min.mjs');
const dest = join(process.cwd(), 'public', 'pdf.worker.min.mjs');

await mkdir(dirname(dest), { recursive: true });
await copyFile(src, dest);
console.log(`copied pdf.js worker -> ${dest}`);
