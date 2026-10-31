import type { APIRoute } from 'astro';
import { getRegistrationStatus, setRegistrationStatus } from '../../../lib/settings';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Cek admin via session
    const session = await locals.getSession();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cek apakah user ada di tabel admins
    const { data: admin, error: adminError } = await locals.supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', session.user.id)
      .single();

    if (adminError || !admin) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const status = await getRegistrationStatus();
    return new Response(JSON.stringify(status), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[admin/registration-status GET] error:', err);
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const session = await locals.getSession();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: admin, error: adminError } = await locals.supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', session.user.id)
      .single();

    if (adminError || !admin) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const open = Boolean(body.open);
    const message = body.message?.trim() || null;

    await setRegistrationStatus(open, message);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[admin/registration-status POST] error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'internal_error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};