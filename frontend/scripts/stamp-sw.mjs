import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const index = await readFile(new URL('../dist/index.html', import.meta.url));
const workerUrl = new URL('../dist/sw.js', import.meta.url);
const worker = await readFile(workerUrl, 'utf8');
const buildId = createHash('sha256').update(index).digest('hex').slice(0, 12);
if (!worker.includes('__BUILD_ID__')) throw new Error('Service worker build placeholder missing');
await writeFile(workerUrl, worker.replace('__BUILD_ID__', buildId));
