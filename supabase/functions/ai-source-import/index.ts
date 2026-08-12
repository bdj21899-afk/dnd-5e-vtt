import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    const prompt = `You are a D&D 5e game master assistant. Analyze this sourcebook page image and extract ALL game content you can see. Return a JSON object with this exact structure:
{
  "monsters": [
    {
      "name": "Monster Name",
      "type": "Humanoid/Beast/Undead/etc",
      "size": "Tiny/Small/Medium/Large/Huge/Gargantuan",
      "alignment": "Chaotic Evil",
      "ac": 13,
      "acNote": "natural armor",
      "hp": "2d8+2",
      "avgHp": 11,
      "speed": "30 ft.",
      "str": 10, "dex": 12, "con": 10, "int": 8, "wis": 10, "cha": 8,
      "cr": "1/2",
      "xp": 100,
      "profBonus": 2,
      "senses": "Darkvision 60 ft., Passive Perception 10",
      "languages": "Common",
      "saves": "",
      "skills": "",
      "immunities": "",
      "resistances": "",
      "traits": [{"name": "Trait Name", "desc": "Description"}],
      "actions": [{"name": "Action Name", "desc": "Full attack description"}],
      "legendaryActions": []
    }
  ],
  "loot": [
    { "name": "Item Name", "value": "50 gp", "description": "Item description", "quantity": 1 }
  ],
  "notes": [
    { "title": "Note Title", "content": "Scene or encounter description", "type": "note" }
  ]
}
Return ONLY valid JSON, no markdown. If a section has nothing, use an empty array [].`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `AI error: ${errText}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content ?? '{}';

    // Strip markdown code fences if present
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { monsters: [], loot: [], notes: [], raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
