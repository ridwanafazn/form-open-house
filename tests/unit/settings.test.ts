import { describe, it, expect, vi } from 'vitest';
import {
  getRegistrationStatus,
  resolveRegistrationStatus,
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

    expect(result).toEqual({
      open: false,
      message: 'Tutup sampai November',
      deadline: null,
      forced: false,
    });

    const url = String(f.mock.calls[0][0]);
    expect(url).toContain('/rest/v1/settings');
    expect(url).toContain(`key=eq.${SETTINGS_KEY}`);
    const headers = f.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer svc');
  });

  it('pesan kosong dinormalkan menjadi null', async () => {
    const f = makeFetch({ status: 200, body: [{ value: { open: false, message: '   ' } }] });
    const result = await getRegistrationStatus(env, f);
    expect(result).toEqual({ open: false, message: null, deadline: null, forced: false });
  });

  it('baris tidak ada => dianggap buka', async () => {
    const f = makeFetch({ status: 200, body: [] });
    const result = await getRegistrationStatus(env, f);
    expect(result).toEqual({ open: true, message: null, deadline: null, forced: false });
  });

  it('tidak memanggil jaringan bila kunci tidak lengkap', async () => {
    const f = makeFetch({ status: 200, body: [] });
    const result = await getRegistrationStatus({ supabaseUrl: '', supabaseServiceRoleKey: '' }, f);
    expect(result).toEqual({ open: true, message: null, deadline: null, forced: false });
    expect(f.mock.calls.length).toBe(0);
  });

  it('HTTP error => dianggap buka agar form tidak terkunci', async () => {
    const f = makeFetch({ status: 500 });
    const result = await getRegistrationStatus(env, f);
    expect(result).toEqual({ open: true, message: null, deadline: null, forced: false });
  });

  it('koneksi gagal => dianggap buka', async () => {
    const f = vi.fn(async () => {
      throw new Error('network');
    }) as unknown as Fetcher;

    const result = await getRegistrationStatus(env, f);
    expect(result).toEqual({ open: true, message: null, deadline: null, forced: false });
  });
});

describe('resolveRegistrationStatus', () => {
  const before = new Date('2026-11-05T16:58:00.000Z'); // 23:58 WIB
  const after = new Date('2026-11-05T17:00:01.000Z'); // 00:00:01 WIB (6 Nov)
  const deadline = '2026-11-05T16:59:00.000Z'; // 23:59 WIB

  it('masih buka sebelum tenggat', () => {
    const result = resolveRegistrationStatus({ open: true, message: null, deadline }, before);
    expect(result.open).toBe(true);
    expect(result.deadline).toBe(deadline);
  });

  it('otomatis tertutup setelah tenggat lewat', () => {
    const result = resolveRegistrationStatus({ open: true, message: null, deadline }, after);
    expect(result.open).toBe(false);
  });

  it('buka paksa mengabaikan tenggat', () => {
    const result = resolveRegistrationStatus(
      { open: true, message: null, deadline, forced: true },
      after,
    );
    expect(result.open).toBe(true);
    expect(result.forced).toBe(true);
  });

  it('tutup manual tetap menang walau ada buka paksa', () => {
    const result = resolveRegistrationStatus(
      { open: false, message: 'Tutup', deadline, forced: true },
      before,
    );
    expect(result).toEqual({ open: false, message: 'Tutup', deadline, forced: true });
  });

  it('tenggat tidak valid diabaikan', () => {
    const result = resolveRegistrationStatus({ open: true, message: null, deadline: 'bukan-tanggal' }, after);
    expect(result).toEqual({ open: true, message: null, deadline: null, forced: false });
  });

  it('tenggat tanpa zona waktu tetap dinormalisasi ke ISO UTC', () => {
    const result = resolveRegistrationStatus(
      { open: true, message: null, deadline: '2026-11-05T23:59:00+07:00' },
      before,
    );
    expect(result.deadline).toBe(deadline);
  });
});
