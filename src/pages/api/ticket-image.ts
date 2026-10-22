import type { APIRoute } from 'astro';
import QRCode from 'qrcode';

export const prerender = false;

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    };
    return entities[character];
  });
}

export const GET: APIRoute = async ({ url }) => {
  const code = url.searchParams.get('code')?.trim() ?? '';
  if (!/^OH-[2-9A-HJ-NP-Z]{6}$/.test(code)) {
    return new Response('Kode tiket tidak valid', { status: 400 });
  }

  const supabaseUrl = import.meta.env.SUPABASE_URL as string | undefined;
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response('Server tidak siap', { status: 500 });
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/registrations?select=child_name,attendee_count,city,school,ticket_code&ticket_code=eq.${encodeURIComponent(code)}&limit=1`,
    { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } },
  );
  if (!response.ok) return new Response('Server tidak siap', { status: 500 });

  const rows = (await response.json().catch(() => [])) as Array<{
    child_name: string;
    attendee_count: number;
    city: string;
    school: string;
    ticket_code: string;
  }>;
  const ticket = rows[0];
  if (!ticket) return new Response('Tiket tidak ditemukan', { status: 404 });

  const qrSvg = await QRCode.toString(ticket.ticket_code, {
    type: 'svg',
    width: 360,
    margin: 2,
    color: { dark: '#1d2c2b', light: '#fffdf8' },
  });
  const qrMarkup = qrSvg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const name = escapeXml(ticket.child_name);
  const school = escapeXml(ticket.school);
  const city = escapeXml(ticket.city);
  const ticketCode = escapeXml(ticket.ticket_code);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1120" viewBox="0 0 900 1120">
  <rect width="900" height="1120" fill="#fffdf8"/>
  <rect x="24" y="24" width="852" height="1072" rx="24" fill="none" stroke="#b7d6cf" stroke-width="6"/>
  <text x="68" y="94" fill="#1d2c2b" font-family="Arial,sans-serif" font-size="36" font-weight="700">OPEN HOUSE SMKIT AS SYIFA</text>
  <text x="68" y="132" fill="#526363" font-family="Arial,sans-serif" font-size="24">Tiket masuk</text>
  <g transform="translate(270 170) scale(.83)">${qrMarkup}</g>
  <text x="68" y="570" fill="#1d2c2b" font-family="Arial,sans-serif" font-size="32" font-weight="700">${name}</text>
  <text x="68" y="610" fill="#526363" font-family="Arial,sans-serif" font-size="23">${ticket.attendee_count} peserta · ${school}</text>
  <text x="68" y="646" fill="#526363" font-family="Arial,sans-serif" font-size="23">${city}</text>
  <text x="68" y="732" fill="#1d2c2b" font-family="monospace" font-size="32" font-weight="700">${ticketCode}</text>
  <text x="68" y="798" fill="#526363" font-family="Arial,sans-serif" font-size="22">Sabtu, 07 November 2026 · 08.00–15.00 WIB</text>
  <text x="68" y="838" fill="#526363" font-family="Arial,sans-serif" font-size="22">SMKIT As Syifa Boarding School, Jalancagak, Subang</text>
  <text x="68" y="908" fill="#526363" font-family="Arial,sans-serif" font-size="22">Tunjukkan tiket ini kepada panitia saat registrasi.</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });
};
