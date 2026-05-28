import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Service-role client bypasses RLS so we can always list the bucket
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await admin.storage
      .from('images')
      .list('', { limit: 500, sortBy: { column: 'name', order: 'asc' } });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Return name + updated_at so the client can append a cache-buster query param.
    // When a file is deleted and re-uploaded with the same name, updated_at changes,
    // making the URL unique and bypassing both browser and CDN cache.
    const files = (data ?? [])
      .filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f.name))
      .map(f => ({ name: f.name, updatedAt: f.updated_at ?? f.created_at ?? '' }));

    return new Response(
      JSON.stringify({ files }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('list-banners error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to list banners' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
