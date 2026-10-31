import { validateRegistration } from './validate';
import { sendWhatsAppViaFonnte } from './fonnte';
import { getRegistrationStatus } from './settings';

export interface RegistrationNotification {
  parentPhone: string;
  childName: string;
  attendeeCount: number;
  ticketCode: string;
  publicSiteUrl?: string;
  fonnteToken?: string;
}

export async function sendRegistrationWhatsApp(notification: RegistrationNotification): Promise<boolean> {
  const ticketUrl = notification.publicSiteUrl
    ? `${notification.publicSiteUrl.replace(/\/$/, '')}/e-ticket/${encodeURIComponent(notification.ticketCode)}`
    : '';
  const message = [
    'Assalamualaikum Ayah/Bunda.',
    '',
    'Pendaftaran Open House SMKIT As-Syifa berhasil kami terima.',
    '',
    `1. 👤 Calon siswa: ${notification.childName}`,
    `2. 👥 Jumlah peserta: ${notification.attendeeCount} orang`,
    `3. 🎟️ Kode tiket: ${notification.ticketCode}`,
    '',
    'Mohon simpan pesan dan gambar tiket ini. Tunjukkan QR Code kepada panitia saat registrasi di lokasi.',
    '',
    '📢Grup peserta: https://chat.whatsapp.com/FqM8p44kE3H5BFNmYj4fys',
    '',
    ticketUrl ? `🔗 Tiket digital:\n${ticketUrl}` : null,
    '',
    'Sampai bertemu di Open House.',
    'Wassalamualaikum.',
    // Hanya null yang dibuang; baris kosong ('') sengaja dipertahankan.
  ].filter((line) => line !== null).join('\n');

  // Fonnte dikirim setelah pendaftaran sukses. Kegagalan notifikasi tidak membatalkan pendaftaran.
  return sendWhatsAppViaFonnte({
    target: notification.parentPhone,
    message,
    // Endpoint SVG server-side yang dapat diambil Fonnte sebagai gambar tiket.
    imageUrl:
      notification.publicSiteUrl && notification.ticketCode
        ? `${notification.publicSiteUrl.replace(/\/$/, '')}/api/ticket-image?code=${encodeURIComponent(notification.ticketCode)}`
        : undefined,
    token: notification.fonnteToken,
  });
}

export interface SubmitEnv {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  fonnteApiToken?: string;
  publicSiteUrl?: string;
}

export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const MAX_BODY = 10 * 1024;

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

  // 3. Cek status pendaftaran dari database (settings table).
  const regStatus = await getRegistrationStatus();
  if (!regStatus.open) {
    return { kind: 'error', status: 403, code: 'closed' };
  }

  // 4. Validasi.
  const result = validateRegistration(parsed);
  if (!result.ok) {
    return { kind: 'error', status: 400, code: 'validation', errors: result.errors };
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

  // Konflik unik (parent_phone, child_name_key): pendaftaran sudah ada
  // sebelumnya. Kembalikan kode tiket yang benar-benar tersimpan di database
  // agar tautan e-tiket tetap valid (bukan kode baru yang tidak pernah disimpan),
  // dan kirim ulang notifikasi WhatsApp memakai kode lama tersebut.
  if (writeRes.status === 409) {
    const existing = await fetchExistingRegistration(
      env,
      fetchImpl,
      result.value.parent_phone,
      result.value.child_name,
    );
    const realCode = existing?.ticket_code || ticketCode;
    if (env.fonnteApiToken && existing && existing.ticket_code) {
      await sendRegistrationWhatsApp({
        parentPhone: result.value.parent_phone,
        childName: result.value.child_name,
        attendeeCount: result.value.attendee_count,
        ticketCode: existing.ticket_code,
        publicSiteUrl: env.publicSiteUrl,
        fonnteToken: env.fonnteApiToken,
      });
    }
    return { kind: 'conflict', status: 200, id: existing?.id, ticket_code: realCode };
  }
  if (!writeRes.ok) {
    const errBody = await writeRes.text().catch(() => '');
    console.error('[submitRegistration] Supabase responded with error:', writeRes.status, errBody);
    return { kind: 'error', status: 500, code: 'server' };
  }

  const inserted = (await writeRes.json().catch(() => [])) as Array<{ id?: string; ticket_code?: string }>;
  const savedRow = Array.isArray(inserted) && inserted[0] ? inserted[0] : null;

  const savedTicketCode = savedRow?.ticket_code || ticketCode;

  // Notifikasi dijalankan setelah data aman tersimpan. Hasil Fonnte tidak
  // memengaruhi respons pendaftaran agar kegagalan layanan tidak menjadi error palsu.
  if (env.fonnteApiToken) {
    await sendRegistrationWhatsApp({
      parentPhone: result.value.parent_phone,
      childName: result.value.child_name,
      attendeeCount: result.value.attendee_count,
      ticketCode: savedTicketCode,
      publicSiteUrl: env.publicSiteUrl,
      fonnteToken: env.fonnteApiToken,
    });
  }

  return {
    kind: 'ok',
    status: 200,
    id: savedRow?.id,
    ticket_code: savedTicketCode,
  };
}

export function bodyTooLarge(rawBodyLength: number): boolean {
  return rawBodyLength > MAX_BODY;
}

function emptyToNull(value: string): string | null {
  return value ? value : null;
}

/**
 * Ambil pendaftaran yang sudah ada ketika write memicu konflik unik
 * (parent_phone, child_name_key). child_name_key di database adalah
 * lower(btrim(child_name)); dicocokkan dengan kunci yang sama di JS.
 */
async function fetchExistingRegistration(
  env: SubmitEnv,
  fetchImpl: Fetcher,
  parentPhone: string,
  childName: string,
): Promise<{ id?: string; ticket_code?: string } | null> {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) return null;
  const childNameKey = childName.trim().toLowerCase();
  const url =
    `${env.supabaseUrl}/rest/v1/registrations` +
    `?select=id,ticket_code` +
    `&parent_phone=eq.${encodeURIComponent(parentPhone)}` +
    `&child_name_key=eq.${encodeURIComponent(childNameKey)}` +
    `&order=created_at.desc&limit=1`;
  try {
    const res = await fetchImpl(url, {
      headers: {
        apikey: env.supabaseServiceRoleKey,
        Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
      },
    });
    if (!res.ok) return null;
    const rows = (await res.json().catch(() => [])) as Array<{
      id?: string;
      ticket_code?: string;
    }>;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}