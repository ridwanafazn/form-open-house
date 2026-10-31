import { createClient } from '@supabase/supabase-js';

// Deteksi environment Cloudflare Workers (runtime)
const isCloudflareWorkers = typeof globalThis !== 'undefined' && 'env' in globalThis;

// Ambil env dari Cloudflare Workers binding atau fallback ke import.meta.env (dev lokal)
function getEnv(key: string): string | undefined {
  if (isCloudflareWorkers) {
    // @ts-expect-error - Cloudflare Workers runtime env
    return globalThis.env?.[key];
  }
  // Fallback ke Vite/import.meta.env untuk dev lokal
  // @ts-expect-error - import.meta.env hanya ada di build time
  return import.meta.env?.[key];
}

const SUPABASE_URL = getEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');

// Hanya throw error di production/runtime, bukan saat test
const isTest = typeof process !== 'undefined' && process.env?.VITEST === 'true';
if (!isTest && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
  throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diatur di environment');
}

// Lazy init supabase client untuk menghindari error saat test tanpa env
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return supabase;
}

export interface RegistrationStatus {
  open: boolean;
  message: string | null;
}

export async function getRegistrationStatus(): Promise<RegistrationStatus> {
  const sb = getSupabase();
  if (!sb) {
    // Test mode tanpa Supabase - default ke buka
    return { open: true, message: null };
  }

  const { data, error } = await sb
    .from('settings')
    .select('value')
    .eq('key', 'registration_open')
    .single();

  if (error) {
    // Jika tidak ditemukan (seharusnya tidak terjadi karena default sudah di-insert), default ke buka
    if (error.code === 'PGRST116') {
      return { open: true, message: null };
    }
    throw new Error(`Gagal baca status pendaftaran: ${error.message}`);
  }

  const value = data.value as { open: boolean; message?: string | null };
  return {
    open: value.open ?? true,
    message: value.message ?? null,
  };
}

export async function setRegistrationStatus(open: boolean, message?: string | null): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    // Test mode tanpa Supabase - tidak melakukan apa-apa
    return;
  }

  const { error } = await sb
    .from('settings')
    .upsert({
      key: 'registration_open',
      value: { open, message: message?.trim() || null },
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Gagal simpan status pendaftaran: ${error.message}`);
  }
}