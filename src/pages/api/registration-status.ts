import type { APIRoute } from 'astro';
import { env as workerEnv } from 'cloudflare:workers';
import { getRegistrationStatus } from '../../lib/settings';

export const prerender = false;

/**
 * Status buka/tutup pendaftaran untuk formulir publik.
 *
 * Binding dibaca saat request (bukan saat modul dimuat) karena di Cloudflare
 * nilai `env` baru tersedia per-request. `import.meta.env` hanya dipakai
 * sebagai cadangan di dev lokal; di produksi nilainya sudah dibekukan Vite
 * saat build sehingga secret dashboard tidak akan pernah sampai ke sini.
 */
export const GET: APIRoute = async () => {
  const runtimeEnv = (workerEnv ?? {}) as Record<string, string | undefined>;

  const status = await getRegistrationStatus(
    {
      supabaseUrl:
        runtimeEnv.SUPABASE_URL || (import.meta.env.SUPABASE_URL as string | undefined) || '',
      supabaseServiceRoleKey:
        runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ||
        (import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined) ||
        '',
    },
    globalThis.fetch.bind(globalThis),
  );

  return new Response(JSON.stringify(status), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Status bisa berubah kapan saja dari panel admin: jangan di-cache.
      'Cache-Control': 'no-store, max-age=0',
    },
  });
};
