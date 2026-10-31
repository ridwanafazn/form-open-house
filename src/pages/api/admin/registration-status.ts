import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';
import { getRegistrationStatus, setRegistrationStatus } from '../../../lib/settings';

export const prerender = false;

async function checkAdminAuth(locals: any): Promise<{ userId: string } | Response> {
  // Cloudflare session binding provides locals.session
  const session = locals.session;
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Cek apakah user ada di tabel admins
  const { data: admin, error: adminError } = await supabase
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

  return { userId: session.user.id };
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    const auth = await checkAdminAuth(locals);
    if (auth instanceof Response) return auth;

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
    const auth = await checkAdminAuth(locals);
    if (auth instanceof Response) return auth;

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