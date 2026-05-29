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

    const imageFiles = (data ?? [])
      .filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f.name));

    // Generate signed URLs (1 year expiry). Unlike public URLs, signed URLs have a
    // unique token generated fresh each call, so the CDN always treats them as new
    // requests — no stale image after delete-and-reupload with the same filename.
    const paths = imageFiles.map(f => f.name);
    const { data: signedData, error: signedError } = await admin.storage
      .from('images')
      .createSignedUrls(paths, 31536000);

    if (signedError || !signedData) {
      // Fall back to public URLs if signing fails
      const files = imageFiles.map(f => ({
        name: f.name,
        url: admin.storage.from('images').getPublicUrl(f.name).data.publicUrl,
      }));
      return new Response(
        JSON.stringify({ files }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const files = signedData.map((s, i) => ({
      name: imageFiles[i].name,
      url: s.signedUrl,
    }));

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
