import type { APIRoute } from 'astro';
import QRCode from 'qrcode';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const code = url.searchParams.get('code')?.trim() ?? '';
  if (!/^OH-[2-9A-HJ-NP-Z]{6}$/.test(code)) {
    return new Response('Kode tiket tidak valid', { status: 400 });
  }

  const svg = await QRCode.toString(code, {
    type: 'svg',
    width: 420,
    margin: 2,
    color: { dark: '#1c1c1a', light: '#ffffff' },
  });

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });
};
