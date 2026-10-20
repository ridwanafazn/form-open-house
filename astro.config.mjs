// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// Halaman publik dibuat statis (default). Hanya /api/register yang dijalankan
// di server lewat `export const prerender = false` di berkas endpoint.
export default defineConfig({
  adapter: cloudflare(),
  integrations: [react()],
});
