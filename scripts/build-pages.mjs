import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const root = process.cwd();
const serverDir = resolve(root, 'dist/server');
const clientDir = resolve(root, 'dist/client');

// Catatan: folder .wrangler TIDAK dihapus di sini. Build Cloudflare Vite plugin
// menulis .wrangler/deploy/config.json yang dipakai `astro preview` dan miniflare.
// Folder cache itu sudah dibersihkan oleh script prebuild sebelum build berikutnya.

if (existsSync(serverDir)) {
  // Salin SEMUA file dan folder modul server dari dist/server/ ke dist/client/
  // agar virtual_astro_middleware.mjs, chunks, dsb. dapat diakses oleh _worker.js
  const entries = readdirSync(serverDir);
  for (const entry of entries) {
    if (entry === 'wrangler.json') continue; // wrangler.toml di root sudah menjadi sumber utama
    const src = resolve(serverDir, entry);
    const dest = resolve(clientDir, entry);
    cpSync(src, dest, { recursive: true });
  }

  // Buat _worker.js di dist/client/ dari entry.mjs
  const entryMjs = resolve(clientDir, 'entry.mjs');
  if (existsSync(entryMjs)) {
    cpSync(entryMjs, resolve(clientDir, '_worker.js'));
    console.log('[build-pages] Generated dist/client/_worker.js');
  }

  // Wrangler menolak binding ASSETS bila config dibaca sebagai proyek Pages
  // (karena pages_build_output_dir di wrangler.toml root). Config ini hanya
  // dipakai untuk preview/miniflare lokal, jadi penanda Pages dilepas di sini.
  const serverWrangler = resolve(serverDir, 'wrangler.json');
  if (existsSync(serverWrangler)) {
    const raw = JSON.parse(readFileSync(serverWrangler, 'utf8'));
    delete raw.pages_build_output_dir;
    delete raw.topLevelName;
    delete raw.userConfigPath;
    writeFileSync(serverWrangler, JSON.stringify(raw));
    console.log('[build-pages] Prepared dist/server/wrangler.json for local preview');
  }

  // Salin seluruh isi dist/client ke root dist agar Cloudflare Pages
  // yang membaca "dist" maupun "dist/client" keduanya sukses
  cpSync(clientDir, resolve(root, 'dist'), { recursive: true });
  console.log('[build-pages] Synchronized all assets to dist/');
}
