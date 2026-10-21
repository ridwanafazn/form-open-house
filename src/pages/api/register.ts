import type { APIRoute } from 'astro';
import { bodyTooLarge, submitRegistration } from '../../lib/submitRegistration';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  // 1. Tolak jika isi lebih dari 10 KB.
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (bodyTooLarge(contentLength)) {
    return new Response('Payload Too Large', { status: 413 });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  // Kunci uji resmi Cloudflare Turnstile yang selalu lolos otomatis (mode pass)
  const CLOUDFLARE_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';
  const env = {
    turnstileSecret:
      (import.meta.env.TURNSTILE_SECRET_KEY as string | undefined) || CLOUDFLARE_TEST_SECRET_KEY,
    registrationOpen: import.meta.env.REGISTRATION_OPEN !== 'false',
    supabaseUrl: (import.meta.env.SUPABASE_URL as string | undefined) ?? '',
    supabaseServiceRoleKey:
      (import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined) ?? '',
  };

  const result = await submitRegistration(parsed, env, globalThis.fetch.bind(globalThis));

  switch (result.kind) {
    case 'bot':
    case 'conflict':
    case 'ok':
      return Response.json({ ok: true }, { status: result.status });
    case 'error':
      if (result.status === 400) {
        return Response.json({ ok: false, errors: result.errors ?? {} }, { status: 400 });
      }
      return Response.json({ ok: false, code: result.code }, { status: result.status });
  }
};
