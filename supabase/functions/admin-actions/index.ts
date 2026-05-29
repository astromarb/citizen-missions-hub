import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Verify the calling user is an admin
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Unauthorized' }, 401);

  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

  const { data: callerProfile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!callerProfile?.is_admin) return json({ error: 'Forbidden' }, 403);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty body is fine for GET-like actions */ }

  const action = body.action as string;

  // ── list_users ──────────────────────────────────────────────────────────────
  if (action === 'list_users') {
    const { data, error } = await admin
      .from('profiles')
      .select('id, callsign, color, home_region, badges, banner_panel, onboarding_complete, is_admin, created_at')
      .order('created_at', { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ users: data });
  }

  // ── reset_onboarding ────────────────────────────────────────────────────────
  if (action === 'reset_onboarding') {
    const userId = body.userId as string;
    if (!userId) return json({ error: 'userId required' }, 400);
    const { error } = await admin
      .from('profiles')
      .update({
        onboarding_complete: false,
        callsign_changed_at: null,
        home_region_changed_at: null,
        rsi_handle_changed_at: null,
      })
      .eq('id', userId);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // ── list_sessions ───────────────────────────────────────────────────────────
  if (action === 'list_sessions') {
    const { data, error } = await admin
      .from('sessions')
      .select(`
        id, date, created_at, started_at, ended_at,
        session_players ( profiles ( id, callsign, color ) ),
        contracts (
          id, type, system, payout, done, claim_cost,
          cargo_items ( scu )
        )
      `)
      .order('date', { ascending: false })
      .limit(200);
    if (error) return json({ error: error.message }, 500);
    return json({ sessions: data });
  }

  // ── upsert_banner_item ──────────────────────────────────────────────────────
  if (action === 'upsert_banner_item') {
    const { filename, displayName, description } = body as {
      filename: string; displayName?: string; description?: string;
    };
    if (!filename) return json({ error: 'filename required' }, 400);
    const { error } = await admin.from('banner_items').upsert({
      filename,
      display_name: displayName ?? null,
      description: description ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'filename' });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // ── upsert_banner_set ───────────────────────────────────────────────────────
  if (action === 'upsert_banner_set') {
    const { setName, description } = body as { setName: string; description?: string };
    if (!setName) return json({ error: 'setName required' }, 400);
    const { error } = await admin.from('banner_sets_meta').upsert({
      set_name: setName,
      description: description ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'set_name' });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // ── create_broadcast ────────────────────────────────────────────────────────
  if (action === 'create_broadcast') {
    const { title, bodyText } = body as { title: string; bodyText?: string };
    if (!title?.trim()) return json({ error: 'title required' }, 400);
    const { error } = await admin.from('broadcasts').insert({
      title: title.trim(),
      body: (bodyText ?? '').trim(),
      created_by: user.id,
    });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // ── list_broadcasts ─────────────────────────────────────────────────────────
  if (action === 'list_broadcasts') {
    const { data, error } = await admin
      .from('broadcasts')
      .select('id, title, body, created_at, sent_at, created_by')
      .order('created_at', { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ broadcasts: data ?? [] });
  }

  return json({ error: `Unknown action: ${action}` }, 400);
});
