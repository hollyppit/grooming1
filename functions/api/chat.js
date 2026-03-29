/**
 * Cloudflare Pages Function: /api/chat
 * Proxies requests to Anthropic API using ANTHROPIC_API_KEY environment variable.
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. ANTHROPIC_API_KEY check
  if (!env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not set in Cloudflare dashboard." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() }
    });
  }

  try {
    const body = await request.json();
    
    // 2. Call Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620", // Use the stable model ID
        max_tokens: body.max_tokens || 1024,
        messages: body.messages,
        system: body.system || "당신은 룰루 그루밍의 전문 컨설턴트입니다."
      })
    });

    const data = await response.json();

    // 3. Return response with CORS headers
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json", ...corsHeaders() }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() }
    });
  }
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key, anthropic-version"
  };
}
