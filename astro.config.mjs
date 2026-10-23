// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// Halaman publik dibuat statis (default). Hanya /api/register yang dijalankan
// di server lewat `export const prerender = false` di berkas endpoint.
export default defineConfig({
  adapter: cloudflare({
    // Prerender berjalan di Node saat build agar konfigurasi Pages di wrangler.toml
    // tidak diproses ulang oleh workerd sebagai konfigurasi worker.
    prerenderEnvironment: 'node',
  }),
  vite: {
    plugins: [tailwindcss()],
    server: {
      // Jangan biarkan browser menyimpan modul dev. Vite memberi URL modul
      // yang bergantung pada hash optimizer; kalau hash berubah di tengah
      // sesi (dep baru ditemukan / server restart), modul lama dari cache
      // bisa bercampur modul baru dan menghasilkan dua instance React.
      headers: {
        'Cache-Control': 'no-store',
      },
    },
    resolve: {
      // Pastikan hanya satu salinan React di dev maupun build. Tanpa ini,
      // Vite bisa memuat dua instance React (mis. dari island + library lain)
      // sehingga hook gagal dengan "Invalid hook call" / "Cannot read
      // properties of null (reading 'useState')".
      dedupe: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        // Pre-bundle dependensi klien lainnya sejak awal supaya Vite tidak
        // menjalankan ulang optimizer di tengah sesi (penyebab modul lama
        // bercampur modul baru di browser).
        '@supabase/supabase-js',
        'html5-qrcode',
        'qrcode',
        'motion/react',
      ],
    },
  },
  integrations: [react()],
});
