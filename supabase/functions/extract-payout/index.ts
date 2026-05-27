import Anthropic from 'npm:@anthropic-ai/sdk';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return json({ error: 'Missing imageBase64 or mimeType' }, 400);
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(mimeType)) {
      return json({ error: `Unsupported image type: ${mimeType}` }, 400);
    }

    const client = new Anthropic();

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: [
                'This is a screenshot from the video game Star Citizen.',
                'Find the mission payout, contract reward, or aUEC transaction amount.',
                'Return ONLY the raw integer value — no commas, no "aUEC" suffix, no explanation.',
                'Examples: "450,000 aUEC" → 450000 | "1,250,500 aUEC" → 1250500',
                'If multiple amounts are visible, return the one that represents the total mission/contract payout.',
                'If no aUEC amount is visible, return exactly: 0',
              ].join(' '),
            },
          ],
        },
      ],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '0';
    const amount = parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0;

    return json({ amount });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});
