// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// Halaman publik dibuat statis (default). Hanya /api/register yang dijalankan
// di server lewat `export const prerender = false` di berkas endpoint.
// Pisahkan folder cache optimizer Vite untuk dev dan build. Keduanya dulu
// menulis ke node_modules/.vite yang sama, sehingga menjalankan `pnpm build`
// saat dev server hidup bisa menimpa file optimizer (deps / deps_ssr) dan
// membuat halaman island melempar error "The file does not exist ... which
// is in the optimize deps directory". defineConfig Astro hanya menerima
// objek, jadi mode dev dideteksi dari argumen CLI (`astro dev`).
const isDevServer = process.argv.includes('dev');

export default defineConfig({
  adapter: cloudflare({
    // Prerender berjalan di Node saat build agar konfigurasi Pages di wrangler.toml
    // tidak diproses ulang oleh workerd sebagai konfigurasi worker.
    prerenderEnvironment: 'node',
  }),
  vite: {
    cacheDir: isDevServer ? 'node_modules/.vite-dev' : 'node_modules/.vite-build',
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
        'html5-qrcode',
        'qrcode',
        'motion/react',
      ],
      exclude: [
        '@supabase/supabase-js',
      ],
    },
  },
  integrations: [react()],
});
