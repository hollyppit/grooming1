export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const { system, messages, max_tokens } = await request.json();

    // ── 1차: Anthropic ──────────────────────────────────────────
    if (env.ANTHROPIC_API_KEY) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5',
            max_tokens: max_tokens || 512,
            system: system || '',
            messages,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        }
      } catch (_) {
        // Anthropic 실패 → OpenAI 폴백으로 이동
      }
    }

    // ── 2차: OpenAI 폴백 ────────────────────────────────────────
    if (env.OPENAI_API_KEY) {
      const openaiMessages = system
        ? [{ role: 'system', content: system }, ...messages]
        : messages;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: max_tokens || 512,
          messages: openaiMessages,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // OpenAI 응답을 Anthropic 형식으로 맞춰서 반환
        // (index.html이 data.content?.[0]?.text 로 읽기 때문)
        const text = data.choices?.[0]?.message?.content || '';
        return new Response(
          JSON.stringify({ content: [{ type: 'text', text }] }),
          { headers: corsHeaders }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'API 키가 없거나 모든 요청이 실패했습니다.' }),
      { status: 500, headers: corsHeaders }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
