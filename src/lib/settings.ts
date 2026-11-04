/**
 * Status pendaftaran disimpan di tabel `settings` (Supabase) pada baris
 * `registration_open` dengan bentuk
 * `{ open: boolean, message: string | null, deadline: string | null, forced: boolean }`.
 *
 * Modul ini sengaja hanya berisi fungsi murni + fetch biasa (tanpa
 * `@supabase/supabase-js`) agar:
 * 1. bisa diuji unit tanpa mock pustaka,
 * 2. aman dijalankan di Cloudflare Workers — env dioper dari route yang
 *    membaca binding `cloudflare:workers`, bukan `import.meta.env` yang
 *    di-replace Vite saat build (lihat catatan T25/T26 di PROGRESS.md).
 */

export interface RegistrationStatus {
  /** Status efektif setelah tenggat waktu dihitung. */
  open: boolean;
  message: string | null;
  /** Tenggat pendaftaran dalam ISO UTC, atau null bila tanpa countdown. */
  deadline: string | null;
  /** Admin membuka paksa formulir setelah tenggat terlewati. */
  forced: boolean;
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
  deadline?: string | null;
  forced?: boolean;
}

/**
 * Ubah nilai mentah dari database menjadi status efektif.
 *
 * Aturan:
 * - `open: false` selalu menutup formulir (keputusan manual admin).
 * - Bila `deadline` terlewati DAN admin tidak memaksa buka (`forced`), formulir
 *   otomatis ditutup — tanpa perlu ada yang menekan tombol.
 * - `forced: true` mengabaikan tenggat sehingga admin tetap bisa membuka
 *   pendaftaran secara manual setelah countdown habis.
 */
export function resolveRegistrationStatus(
  value: RegistrationOpenValue | null | undefined,
  now: Date = new Date(),
): RegistrationStatus {
  const manualOpen = value?.open ?? true;
  const message =
    typeof value?.message === 'string' && value.message.trim() ? value.message.trim() : null;
  const deadline = normalizeDeadline(value?.deadline);
  const forced = value?.forced === true;

  if (!manualOpen) {
    return { open: false, message, deadline, forced };
  }

  if (deadline && !forced) {
    const deadlineMs = Date.parse(deadline);
    if (Number.isFinite(deadlineMs) && now.getTime() >= deadlineMs) {
      return { open: false, message, deadline, forced };
    }
  }

  return { open: true, message, deadline, forced };
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
  now: Date = new Date(),
): Promise<RegistrationStatus> {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return resolveRegistrationStatus(null, now);
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
      return resolveRegistrationStatus(null, now);
    }

    const rows = (await res.json().catch(() => [])) as Array<{ value?: RegistrationOpenValue }>;
    const value = Array.isArray(rows) && rows[0] ? rows[0].value : undefined;
    return resolveRegistrationStatus(value, now);
  } catch (err) {
    console.error('[settings] fetch failed:', err);
    return resolveRegistrationStatus(null, now);
  }
}

/** Normalisasi tenggat ke ISO UTC; nilai tidak valid dianggap tanpa tenggat. */
export function normalizeDeadline(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}
