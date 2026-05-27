import OpenAI from 'npm:openai@^4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType, rsiHandle } = await req.json();

    if (!imageBase64 || !mimeType || !rsiHandle) {
      return new Response(
        JSON.stringify({ error: 'Missing imageBase64, mimeType, or rsiHandle' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const client = new OpenAI({ apiKey });

    // OpenAI vision supports 'low' and 'high'; 'high' gives best accuracy for HUD text
    const response = await client.chat.completions.create({
      model: 'gpt-4.1-nano',
      max_tokens: 32,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: `This is a Star Citizen screenshot. Find the username "${rsiHandle.toUpperCase()}" in the image and return the aUEC balance number that appears directly above or next to it (shown with a ≡ symbol). Return only the integer with no commas, no currency symbol, and no explanation. If you cannot find the username or a valid balance, return 0.`,
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? '0';
    const amount = parseInt(raw.replace(/[^0-9]/g, ''), 10);

    return new Response(
      JSON.stringify({ amount: isNaN(amount) ? 0 : amount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('extract-auec-balance error:', err);
    return new Response(
      JSON.stringify({ error: 'Scan failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
