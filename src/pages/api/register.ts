import type { APIRoute } from 'astro';
import { env as workerEnv } from 'cloudflare:workers';
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

  // Env dibaca runtime-dulu dari binding Cloudflare (`cloudflare:workers`),
  // lalu fallback import.meta.env (build-time, untuk dev lokal). Di Astro 6+,
  // `locals.runtime.env` sudah DILARANG dan melempar exception; walau dulu
  // dibaca lewat import.meta.env, secret dashboard tidak pernah sampai karena
  // import.meta.env di-replace Vite saat build.
  const runtimeEnv = (workerEnv ?? {}) as Record<string, string | undefined>;
  const publicSiteUrl =
    runtimeEnv.PUBLIC_SITE_URL || (import.meta.env.PUBLIC_SITE_URL as string | undefined) || '';

  const env = {
    registrationOpen:
      (runtimeEnv.REGISTRATION_OPEN ?? import.meta.env.REGISTRATION_OPEN) !== 'false',
    supabaseUrl:
      runtimeEnv.SUPABASE_URL || (import.meta.env.SUPABASE_URL as string | undefined) || '',
    supabaseServiceRoleKey:
      runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ||
      (import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined) ||
      '',
    fonnteApiToken:
      runtimeEnv.FONNTE_API_TOKEN || (import.meta.env.FONNTE_API_TOKEN as string | undefined) || '',
    publicSiteUrl,
  };

  const result = await submitRegistration(parsed, env, globalThis.fetch.bind(globalThis));

  switch (result.kind) {
    case 'bot':
      return Response.json({ ok: true }, { status: result.status });
    case 'conflict':
    case 'ok':
      return Response.json(
        {
          ok: true,
          id: result.id,
          ticket_code: result.ticket_code,
        },
        { status: result.status },
      );
    case 'error':
      if (result.status === 400) {
        return Response.json({ ok: false, errors: result.errors ?? {} }, { status: 400 });
      }
      return Response.json({ ok: false, code: result.code }, { status: result.status });
  }
};
