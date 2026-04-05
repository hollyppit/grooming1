export async function onRequestGet(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const maxResults = url.searchParams.get('maxResults') || '5';

    if (!env.YOUTUBE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'YOUTUBE_API_KEY가 설정되지 않았습니다.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q)}&maxResults=${maxResults}&key=${env.YOUTUBE_API_KEY}`;

    const res = await fetch(ytUrl);
    const data = await res.json();

    return new Response(JSON.stringify(data), { headers: corsHeaders });

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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
