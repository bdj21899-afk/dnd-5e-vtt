import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { name, race, charClass, alignment, background } = await req.json();

    if (!race || !charClass) {
      return new Response(JSON.stringify({ error: 'race and charClass are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    const prompt = `D&D fantasy character portrait of a ${race} ${charClass}${name ? ` named ${name}` : ''}${alignment ? `, ${alignment} alignment` : ''}${background ? `, ${background} background` : ''}. High quality fantasy art, dramatic lighting, detailed face and costume, dungeon and dragons character art style, painted portrait, heroic pose, square format, masterpiece.`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        modalities: ['image', 'text'],
        messages: [{ role: 'user', content: prompt }],
        image_config: { aspect_ratio: '1:1', image_size: '1K' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `AI error: ${errText}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'No image generated' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upload to Supabase Storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Convert base64 data URL to blob
    const base64Data = imageUrl.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const blob = new Blob([binaryData], { type: 'image/png' });

    const fileName = `avatars/${crypto.randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('dnd-maps')
      .upload(fileName, blob, { contentType: 'image/png', cacheControl: '86400', upsert: false });

    if (uploadError) {
      // Fallback: return base64 directly
      return new Response(JSON.stringify({ url: imageUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { publicUrl } } = supabase.storage.from('dnd-maps').getPublicUrl(fileName);

    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
