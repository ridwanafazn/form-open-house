import { describe, it, expect, vi } from 'vitest';
import {
  getRegistrationStatus,
  SETTINGS_KEY,
  type Fetcher,
  type SettingsEnv,
} from '../../src/lib/settings';

const env: SettingsEnv = {
  supabaseUrl: 'https://proj.supabase.co',
  supabaseServiceRoleKey: 'svc',
};

function makeFetch(response: { status: number; body?: unknown }): Fetcher {
  return vi.fn(async () => {
    const body = response.body === undefined ? '[]' : JSON.stringify(response.body);
    return new Response(body, { status: response.status });
  }) as unknown as Fetcher;
}

describe('getRegistrationStatus', () => {
  it('membaca nilai dari tabel settings', async () => {
    const f = makeFetch({
      status: 200,
      body: [{ value: { open: false, message: 'Tutup sampai November' } }],
    });

    const result = await getRegistrationStatus(env, f);

    expect(result).toEqual({ open: false, message: 'Tutup sampai November' });

    const url = String(f.mock.calls[0][0]);
    expect(url).toContain('/rest/v1/settings');
    expect(url).toContain(`key=eq.${SETTINGS_KEY}`);
    const headers = f.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer svc');
  });

  it('pesan kosong dinormalkan menjadi null', async () => {
    const f = makeFetch({ status: 200, body: [{ value: { open: false, message: '   ' } }] });
    const result = await getRegistrationStatus(env, f);
    expect(result).toEqual({ open: false, message: null });
  });

  it('baris tidak ada => dianggap buka', async () => {
    const f = makeFetch({ status: 200, body: [] });
    const result = await getRegistrationStatus(env, f);
    expect(result).toEqual({ open: true, message: null });
  });

  it('tidak memanggil jaringan bila kunci tidak lengkap', async () => {
    const f = makeFetch({ status: 200, body: [] });
    const result = await getRegistrationStatus({ supabaseUrl: '', supabaseServiceRoleKey: '' }, f);
    expect(result).toEqual({ open: true, message: null });
    expect(f.mock.calls.length).toBe(0);
  });

  it('HTTP error => dianggap buka agar form tidak terkunci', async () => {
    const f = makeFetch({ status: 500 });
    const result = await getRegistrationStatus(env, f);
    expect(result).toEqual({ open: true, message: null });
  });

  it('koneksi gagal => dianggap buka', async () => {
    const f = vi.fn(async () => {
      throw new Error('network');
    }) as unknown as Fetcher;

    const result = await getRegistrationStatus(env, f);
    expect(result).toEqual({ open: true, message: null });
  });
});
