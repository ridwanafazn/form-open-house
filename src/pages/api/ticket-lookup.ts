import type { APIRoute } from 'astro';
import { env as workerEnv } from 'cloudflare:workers';
import { isValidPhone, normalizePhone } from '../../lib/phone';

export const prerender = false;

const CODE_PATTERN = /^OH-[2-9A-HJ-NP-Z]{6}$/;

// Pembatas sederhana per instance: cukup untuk menahan tebakan nomor beruntun.
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_HITS = 20;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_HITS;
}

interface TicketRow {
  child_name: string;
  attendee_count: number;
  city: string;
  school: string;
  ticket_code: string;
}

export const POST: APIRoute = async ({ request }) => {
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  if (isRateLimited(ip)) {
    return Response.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { query?: unknown } | null;
  const raw = typeof body?.query === 'string' ? body.query.trim() : '';
  if (!raw) {
    return Response.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  const runtimeEnv = (workerEnv ?? {}) as Record<string, string | undefined>;
  const supabaseUrl = runtimeEnv.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const serviceRoleKey =
    runtimeEnv.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ ok: false, error: 'server' }, { status: 500 });
  }

  const ticketCode = raw.toUpperCase();
  const isCode = CODE_PATTERN.test(ticketCode);
  const normalizedPhone = normalizePhone(raw);
  const isPhone = !isCode && isValidPhone(normalizedPhone);

  if (!isCode && !isPhone) {
    return Response.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  const filter = isCode
    ? `ticket_code=eq.${encodeURIComponent(ticketCode)}`
    : `parent_phone=eq.${encodeURIComponent(normalizedPhone)}`;
  const select = 'child_name,attendee_count,city,school,ticket_code';

  const response = await fetch(
    `${supabaseUrl}/rest/v1/registrations?select=${select}&${filter}&limit=10`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );

  if (!response.ok) {
    return Response.json({ ok: false, error: 'server' }, { status: 500 });
  }

  const rows = (await response.json().catch(() => [])) as TicketRow[];
  if (rows.length === 0) {
    return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  return Response.json(
    {
      ok: true,
      tickets: rows.map((row) => ({
        child_name: row.child_name,
        attendee_count: row.attendee_count,
        city: row.city,
        school: row.school,
        ticket_code: row.ticket_code,
      })),
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
};
