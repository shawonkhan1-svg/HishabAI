// Runs before `next build`: stamps a unique version into public/sw.js so every
// deploy makes browsers install a new service worker (the OTA update prompt).
import { readFileSync, writeFileSync } from 'node:fs';

const sha = (process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7);
const day = new Date().toISOString().slice(0, 10).replaceAll('-', '.');
const id = `${day}-${sha}`;

const swPath = 'public/sw.js';
const sw = readFileSync(swPath, 'utf8');
if (!/const BUILD = '[^']*';/.test(sw)) throw new Error('BUILD constant not found in public/sw.js');
writeFileSync(swPath, sw.replace(/const BUILD = '[^']*';/, `const BUILD = '${id}';`));
writeFileSync('.build-id', id);
console.log(`Stamped build ${id}`);
