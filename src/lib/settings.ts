/**
 * Status pendaftaran disimpan di tabel `settings` (Supabase) pada baris
 * `registration_open` dengan bentuk `{ open: boolean, message: string | null }`.
 *
 * Modul ini sengaja hanya berisi fungsi murni + fetch biasa (tanpa
 * `@supabase/supabase-js`) agar:
 * 1. bisa diuji unit tanpa mock pustaka,
 * 2. aman dijalankan di Cloudflare Workers — env dioper dari route yang
 *    membaca binding `cloudflare:workers`, bukan `import.meta.env` yang
 *    di-replace Vite saat build (lihat catatan T25/T26 di PROGRESS.md).
 */

export interface RegistrationStatus {
  open: boolean;
  message: string | null;
}

export interface SettingsEnv {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export const SETTINGS_KEY = 'registration_open';

/** Bentuk nilai yang disimpan di kolom `value` (jsonb). */
export interface RegistrationOpenValue {
  open: boolean;
  message: string | null;
}

/**
 * Baca status pendaftaran lewat REST Supabase memakai service role key.
 * Gagal baca (jaringan/HTTP) diperlakukan sebagai "buka" agar satu gangguan
 * sementara tidak mengunci seluruh calon peserta; penulisan data tetap
 * divalidasi ulang di server dan akan gagal dengan 500 bila database mati.
 */
export async function getRegistrationStatus(
  env: SettingsEnv,
  fetchImpl: Fetcher,
): Promise<RegistrationStatus> {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return { open: true, message: null };
  }

  const url =
    `${env.supabaseUrl}/rest/v1/settings` +
    `?key=eq.${encodeURIComponent(SETTINGS_KEY)}` +
    `&select=value&limit=1`;

  try {
    const res = await fetchImpl(url, {
      headers: {
        apikey: env.supabaseServiceRoleKey,
        Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.error('[settings] Supabase responded with status', res.status);
      return { open: true, message: null };
    }

    const rows = (await res.json().catch(() => [])) as Array<{ value?: RegistrationOpenValue }>;
    const value = Array.isArray(rows) && rows[0] ? rows[0].value : undefined;
    if (!value) return { open: true, message: null };

    return {
      open: value.open ?? true,
      message: typeof value.message === 'string' && value.message.trim() ? value.message : null,
    };
  } catch (err) {
    console.error('[settings] fetch failed:', err);
    return { open: true, message: null };
  }
}
