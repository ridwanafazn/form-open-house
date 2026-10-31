import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { getRegistrationStatus, setRegistrationStatus } from '../../../lib/settings';

export const prerender = false;

function createSupabaseServerClient(request: Request) {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key not configured');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    },
  });
}

async function checkAdminAuth(request: Request): Promise<{ userId: string } | Response> {
  const supabase = createSupabaseServerClient(request);
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user) {
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

export const GET: APIRoute = async ({ request }) => {
  try {
    const auth = await checkAdminAuth(request);
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const auth = await checkAdminAuth(request);
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