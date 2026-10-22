import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const code = url.searchParams.get('code')?.trim() ?? '';
  if (!/^OH-[2-9A-HJ-NP-Z]{6}$/.test(code)) {
    return Response.json({ ok: false, error: 'ticket_invalid' }, { status: 400 });
  }

  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env;
  const supabaseUrl = runtimeEnv?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const serviceRoleKey = runtimeEnv?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ ok: false, error: 'server' }, { status: 500 });
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/registrations?select=child_name,attendee_count,city,school,ticket_code&ticket_code=eq.${encodeURIComponent(code)}&limit=1`,
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

  const rows = (await response.json().catch(() => [])) as Array<{
    child_name: string;
    attendee_count: number;
    city: string;
    school: string;
    ticket_code: string;
  }>;
  const ticket = rows[0];
  if (!ticket) {
    return Response.json({ ok: false, error: 'ticket_not_found' }, { status: 404 });
  }

  return Response.json(
    {
      ok: true,
      ticket: {
        child_name: ticket.child_name,
        attendee_count: ticket.attendee_count,
        city: ticket.city,
        school: ticket.school,
        ticket_code: ticket.ticket_code,
      },
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
};
