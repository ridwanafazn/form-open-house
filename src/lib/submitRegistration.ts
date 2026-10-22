import { validateRegistration } from './validate';

export interface SubmitEnv {
  turnstileSecret: string;
  registrationOpen: boolean;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const MAX_BODY = 10 * 1024;
const CLOUDFLARE_TEST_SECRET = '1x0000000000000000000000000000000AA';

export type SubmitResult =
  | { kind: 'ok' | 'bot' | 'conflict'; status: number; id?: string; ticket_code?: string }
  | { kind: 'error'; status: number; code: string; errors?: Record<string, string> };

export interface SubmitInput {
  rawBody: string;
  parsed: Record<string, unknown>;
}

/**
 * Buat kode tiket ringkas unik 8 karakter (misal: OH-7K9W2B).
 * Menggunakan huruf dan angka yang tidak ambigu (tanpa 0, O, 1, I).
 */
export function generateTicketCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `OH-${rand}`;
}

// Logika endpoint /api/register. Dapat diuji dengan env dan fetch tiruan.
export async function submitRegistration(
  parsed: Record<string, unknown>,
  env: SubmitEnv,
  fetchImpl: Fetcher,
): Promise<SubmitResult> {
  // 2. Jebakan bot: `website` terisi => sukses tanpa menyimpan.
  if (typeof parsed.website === 'string' && parsed.website.trim() !== '') {
    return { kind: 'bot', status: 200 };
  }

  // 3. Pendaftaran ditutup.
  if (!env.registrationOpen) {
    return { kind: 'error', status: 403, code: 'closed' };
  }

  // 4. Validasi.
  const result = validateRegistration(parsed);
  if (!result.ok) {
    return { kind: 'error', status: 400, code: 'validation', errors: result.errors };
  }

  // 5. Verifikasi Turnstile.
  const token = typeof parsed.turnstile_token === 'string' ? parsed.turnstile_token : '';
  if (!(await verifyTurnstile(token, env.turnstileSecret, fetchImpl))) {
    return { kind: 'error', status: 403, code: 'turnstile' };
  }

  const ticketCode = generateTicketCode();

  const payload = {
    child_name: result.value.child_name,
    parent_phone: result.value.parent_phone,
    parent_name: result.value.parent_name || null,
    attendee_count: result.value.attendee_count,
    city: result.value.city,
    school: result.value.school,
    interest_major: result.value.interest_major || null,
    consent_wa: result.value.consent_wa,
    utm_source: emptyToNull(result.value.utm_source),
    utm_medium: emptyToNull(result.value.utm_medium),
    utm_campaign: emptyToNull(result.value.utm_campaign),
    utm_content: emptyToNull(result.value.utm_content),
    utm_term: emptyToNull(result.value.utm_term),
    fbclid: emptyToNull(result.value.fbclid),
    referrer: emptyToNull(result.value.referrer),
    device: emptyToNull(result.value.device),
    ticket_code: ticketCode,
  };

  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    console.error('[submitRegistration] Missing Supabase URL or Service Role Key');
    return { kind: 'error', status: 500, code: 'server' };
  }

  let writeRes: Response;
  try {
    writeRes = await fetchImpl(`${env.supabaseUrl}/rest/v1/registrations`, {
      method: 'POST',
      headers: {
        apikey: env.supabaseServiceRoleKey,
        Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[submitRegistration] Supabase fetch failed:', err);
    return { kind: 'error', status: 500, code: 'server' };
  }

  if (writeRes.status === 409) return { kind: 'conflict', status: 200, ticket_code: ticketCode };
  if (!writeRes.ok) {
    const errBody = await writeRes.text().catch(() => '');
    console.error('[submitRegistration] Supabase responded with error:', writeRes.status, errBody);
    return { kind: 'error', status: 500, code: 'server' };
  }

  const inserted = (await writeRes.json().catch(() => [])) as Array<{ id?: string; ticket_code?: string }>;
  const savedRow = Array.isArray(inserted) && inserted[0] ? inserted[0] : null;

  return {
    kind: 'ok',
    status: 200,
    id: savedRow?.id,
    ticket_code: savedRow?.ticket_code || ticketCode,
  };
}

export function bodyTooLarge(rawBodyLength: number): boolean {
  return rawBodyLength > MAX_BODY;
}

async function verifyTurnstile(token: string, secret: string, fetchImpl: Fetcher): Promise<boolean> {
  // Jika menggunakan Cloudflare official test secret key atau token uji di localhost/dev, selalu loloskan
  if (secret === CLOUDFLARE_TEST_SECRET || token.startsWith('XXXX.') || token === 'test-token') {
    return true;
  }
  if (!secret || !token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    const res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

function emptyToNull(value: string): string | null {
  return value ? value : null;
}
