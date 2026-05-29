import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DISCORD_API = 'https://discord.com/api/v10';
const APP_URL = 'https://citizen-missions-hub.vercel.app';

async function sendDM(botToken: string, discordUserId: string, content: string): Promise<void> {
  // Open (or reuse) a DM channel with the target user
  const chanRes = await fetch(`${DISCORD_API}/users/@me/channels`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipient_id: discordUserId }),
  });

  if (!chanRes.ok) {
    const body = await chanRes.text();
    throw new Error(`Open DM channel failed (${chanRes.status}): ${body}`);
  }

  const { id: channelId } = await chanRes.json();

  const msgRes = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!msgRes.ok) {
    const body = await msgRes.text();
    throw new Error(`Send message failed (${msgRes.status}): ${body}`);
  }
}

function buildMessage(type: string, payload: Record<string, string>): string {
  switch (type) {
    case 'friend_request':
      return [
        `👥 **${payload.senderCallsign}** sent you a crew request on **Citizen Missions Hub**!`,
        `→ ${APP_URL}/?tab=friends`,
      ].join('\n');

    case 'session_invite':
      return [
        `🚀 **${payload.inviterCallsign}** invited you to a mission session` +
          (payload.sessionDate ? ` on **${payload.sessionDate}**` : '') + '!',
        `→ ${APP_URL}/?tab=friends`,
      ].join('\n');

    default:
      return `📡 You have a new notification on **Citizen Missions Hub**.\n→ ${APP_URL}`;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) {
      // Silently skip — bot not configured yet
      return json({ skipped: 'DISCORD_BOT_TOKEN not set' });
    }

    // Require caller to be authenticated
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify the JWT from the frontend
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const { type, recipientUserId, ...payload } = await req.json() as Record<string, string>;

    if (!recipientUserId) return json({ error: 'recipientUserId required' }, 400);

    // Look up the recipient's Discord identity (requires service role)
    const { data: userData, error: userErr } = await admin.auth.admin.getUserById(recipientUserId);
    if (userErr || !userData?.user) return json({ skipped: 'Recipient not found' });

    const discordIdentity = userData.user.identities?.find(
      (i: { provider: string }) => i.provider === 'discord'
    );
    if (!discordIdentity) return json({ skipped: 'Recipient has no Discord login' });

    // provider_id is the Discord user ID (snowflake)
    const discordUserId: string = discordIdentity.provider_id ?? discordIdentity.identity_data?.sub;
    if (!discordUserId) return json({ skipped: 'Could not resolve Discord user ID' });

    const content = buildMessage(type, payload as Record<string, string>);
    await sendDM(botToken, discordUserId, content);

    console.log(`discord-notify: sent ${type} DM to Discord user ${discordUserId}`);
    return json({ ok: true });

  } catch (err) {
    // Non-blocking — always return 200 so the calling action never fails
    console.error('discord-notify error:', err);
    return json({ skipped: String(err) });
  }
});
