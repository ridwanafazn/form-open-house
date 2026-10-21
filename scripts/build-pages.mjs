import { cpSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const root = process.cwd();
const serverDir = resolve(root, 'dist/server');
const clientDir = resolve(root, 'dist/client');

if (existsSync(serverDir)) {
  // Salin file server utama ke dist/client/_worker.js
  const entryMjs = resolve(serverDir, 'entry.mjs');
  if (existsSync(entryMjs)) {
    cpSync(entryMjs, resolve(clientDir, '_worker.js'));
    console.log('[build-pages] dist/server/entry.mjs -> dist/client/_worker.js');
  }

  // Salin folder chunks bila ada
  const chunksDir = resolve(serverDir, 'chunks');
  if (existsSync(chunksDir)) {
    cpSync(chunksDir, resolve(clientDir, 'chunks'), { recursive: true });
    console.log('[build-pages] dist/server/chunks -> dist/client/chunks');
  }

  // Salin seluruh isi dist/client ke root dist agar Cloudflare Pages
  // yang disetel output 'dist' maupun 'dist/client' keduanya PASTI berhasil!
  cpSync(clientDir, resolve(root, 'dist'), { recursive: true });
  console.log('[build-pages] dist/client/* -> dist/*');
}
