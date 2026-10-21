import { cpSync, existsSync, readdirSync, rmSync } from 'fs';
import { resolve } from 'path';

const root = process.cwd();
const serverDir = resolve(root, 'dist/server');
const clientDir = resolve(root, 'dist/client');

if (existsSync(serverDir)) {
  // Salin SEMUA file dan folder dari dist/server/ ke dist/client/
  // agar seluruh modul (entry.mjs, virtual_astro_middleware.mjs, chunks, dll)
  // tersedia utuh bagi bundler Wrangler / Cloudflare Pages.
  const entries = readdirSync(serverDir);
  for (const entry of entries) {
    if (entry === 'wrangler.json') continue; // Hindari konflik config Wrangler
    const src = resolve(serverDir, entry);
    const dest = resolve(clientDir, entry);
    cpSync(src, dest, { recursive: true });
  }

  // File entry server utama harus bernama _worker.js di Cloudflare Pages
  const entryMjs = resolve(clientDir, 'entry.mjs');
  if (existsSync(entryMjs)) {
    cpSync(entryMjs, resolve(clientDir, '_worker.js'));
    console.log('[build-pages] Generated dist/client/_worker.js');
  }

  // Hapus dist/server/wrangler.json jika ada di root output agar Cloudflare Pages
  // tidak membatalkan Pages build karena membaca format Workers lama
  const distServerWrangler = resolve(serverDir, 'wrangler.json');
  if (existsSync(distServerWrangler)) {
    rmSync(distServerWrangler, { force: true });
  }

  // Salin seluruh isi dist/client ke root dist agar apapun pengaturan
  // Cloudflare Pages ("dist" atau "dist/client"), semuanya PASTI berhasil!
  cpSync(clientDir, resolve(root, 'dist'), { recursive: true });
  console.log('[build-pages] Synchronized all files across dist/ and dist/client/');
}
