import type { APIRoute } from 'astro';
import { getRegistrationStatus } from '../../lib/settings';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const status = await getRegistrationStatus();
    return new Response(JSON.stringify(status), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('[registration-status] error:', err);
    return new Response(
      JSON.stringify({ open: true, message: null, error: 'internal_error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};