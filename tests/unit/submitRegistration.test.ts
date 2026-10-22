import { describe, it, expect, vi } from 'vitest';
import { submitRegistration, bodyTooLarge, type Fetcher } from '../../src/lib/submitRegistration';

const valid = {
  child_name: 'Ahmad',
  parent_phone: '081234567890',
  parent_name: 'Budi',
  attendee_count: 2,
  city: 'Subang',
  school: 'SMP Negeri 1 Subang',
  interest_major: 'rpl',
  consent_wa: true,
  turnstile_token: 'tok',
};

function env(over: Partial<Parameters<typeof submitRegistration>[1]> = {}) {
  return {
    turnstileSecret: 'secret',
    registrationOpen: true,
    supabaseUrl: 'https://proj.supabase.co',
    supabaseServiceRoleKey: 'svc',
    ...over,
  };
}

function makeFetch(routes: Record<string, { status: number; body?: unknown }>): Fetcher {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const hit = routes[url];
    const status = hit ? hit.status : 500;
    const body = hit && hit.body !== undefined ? JSON.stringify(hit.body) : '{}';
    return new Response(body, { status });
  });
  return fn as unknown as Fetcher;
}

function turnstileOk(turnstileStatus = 200) {
  return {
    'https://challenges.cloudflare.com/turnstile/v0/siteverify': {
      status: turnstileStatus,
      body: { success: true },
    },
  };
}

describe('bodyTooLarge', () => {
  it('benar ketika lebih dari 10 KB', () => {
    expect(bodyTooLarge(11 * 1024)).toBe(true);
    expect(bodyTooLarge(10 * 1024)).toBe(false);
    expect(bodyTooLarge(100)).toBe(false);
  });
});

describe('submitRegistration', () => {
  it('bot: website terisi => sukses tanpa menyimpan', async () => {
    const f = makeFetch({});
    const r = await submitRegistration({ ...valid, website: 'x' }, env(), f);
    expect(r.kind).toBe('bot');
    expect(f.mock.calls.length).toBe(0);
  });

  it('pendaftaran ditutup => 403 closed', async () => {
    const f = makeFetch({});
    const r = await submitRegistration(valid, env({ registrationOpen: false }), f);
    expect(r).toEqual({ kind: 'error', status: 403, code: 'closed' });
  });

  it('nomor tidak valid => 400 dengan errors', async () => {
    const f = makeFetch(turnstileOk());
    const r = await submitRegistration({ ...valid, parent_phone: '123' }, env(), f);
    expect(r.kind).toBe('error');
    expect(r.status).toBe(400);
    if (r.kind === 'error') expect(r.errors?.parent_phone).toBeDefined();
  });

  it('Turnstile gagal => 403 turnstile, tidak menulis', async () => {
    const f = makeFetch({
      'https://challenges.cloudflare.com/turnstile/v0/siteverify': {
        status: 200,
        body: { success: false },
      },
    });
    const r = await submitRegistration(valid, env(), f);
    expect(r).toEqual({ kind: 'error', status: 403, code: 'turnstile' });
  });

  it('kunci uji Turnstile selalu lolos tanpa memanggil siteverify', async () => {
    const f = makeFetch({
      'https://proj.supabase.co/rest/v1/registrations': { status: 201 },
    });
    const r = await submitRegistration(
      valid,
      env({ turnstileSecret: '1x0000000000000000000000000000000AA' }),
      f,
    );
    expect(r.kind).toBe('ok');
    const siteverifyCall = f.mock.calls.find((c) => String(c[0]).includes('/siteverify'));
    expect(siteverifyCall).toBeUndefined();
  });

  it('token uji klien tidak lolos tanpa verifikasi server', async () => {
    const f = makeFetch({
      'https://challenges.cloudflare.com/turnstile/v0/siteverify': {
        status: 200,
        body: { success: false },
      },
    });
    const r = await submitRegistration(
      { ...valid, turnstile_token: 'XXXX.DUMMY.TOKEN.XXXX' },
      env(),
      f,
    );
    expect(r).toEqual({ kind: 'error', status: 403, code: 'turnstile' });
  });

  it('kunci Turnstile tidak dikonfigurasi => 503 config tanpa menulis', async () => {
    const f = makeFetch({
      'https://proj.supabase.co/rest/v1/registrations': { status: 201 },
    });
    const r = await submitRegistration(valid, env({ turnstileSecret: '' }), f);
    expect(r).toEqual({ kind: 'error', status: 503, code: 'config' });
    expect(f.mock.calls.length).toBe(0);
  });

  it('sukses dan menulis ke Supabase dengan service role key', async () => {
    const f = makeFetch({
      ...turnstileOk(),
      'https://proj.supabase.co/rest/v1/registrations': { status: 201 },
    });
    const r = await submitRegistration(valid, env(), f);
    expect(r.kind).toBe('ok');
    expect(r.status).toBe(200);
    if (r.kind === 'ok') {
      expect(r.ticket_code).toMatch(/^OH-[2-9A-Z]{6}$/);
    }
    const writeCall = f.mock.calls.find((c) => String(c[0]).includes('/rest/v1/registrations'));
    expect(writeCall).toBeDefined();
    const headers = writeCall?.[1]?.headers as Record<string, string>;
    expect(headers?.Authorization).toContain('svc');
  });

  it('konflik 409 dianggap sukses', async () => {
    const f = makeFetch({
      ...turnstileOk(),
      'https://proj.supabase.co/rest/v1/registrations': { status: 409 },
    });
    const r = await submitRegistration(valid, env(), f);
    expect(r.kind).toBe('conflict');
    expect(r.status).toBe(200);
  });

  it('gagal server -> 500 tanpa rincian', async () => {
    const f = makeFetch({
      ...turnstileOk(),
      'https://proj.supabase.co/rest/v1/registrations': { status: 500 },
    });
    const r = await submitRegistration(valid, env(), f);
    expect(r).toEqual({ kind: 'error', status: 500, code: 'server' });
  });

  it('koneksi gagal (throw) di penulisan -> 500 server', async () => {
    const f = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/siteverify')) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      throw new Error('network');
    }) as unknown as Fetcher;
    const r = await submitRegistration(valid, env(), f);
    expect(r).toEqual({ kind: 'error', status: 500, code: 'server' });
  });

  it('kunci Supabase tidak ada -> 500 tanpa fetch lain', async () => {
    const f = makeFetch(turnstileOk());
    const r = await submitRegistration(valid, env({ supabaseServiceRoleKey: '' }), f);
    expect(r).toEqual({ kind: 'error', status: 500, code: 'server' });
  });
});
