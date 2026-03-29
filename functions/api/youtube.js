/**
 * GET /api/youtube?q=검색키워드&maxResults=5
 *
 * Cloudflare Pages Function
 * 환경변수: YOUTUBE_API_KEY (Cloudflare Pages > Settings > Environment variables)
 */
export async function onRequestGet({ request, env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8',
  };

  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const maxResults = Math.min(parseInt(url.searchParams.get('maxResults') || '5'), 10);

    if (!q) {
      return new Response(JSON.stringify({ error: 'q 파라미터가 필요합니다.' }), {
        status: 400, headers: corsHeaders,
      });
    }

    const apiKey = env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'YOUTUBE_API_KEY 환경변수가 설정되지 않았습니다.' }), {
        status: 500, headers: corsHeaders,
      });
    }

    const ytUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    ytUrl.searchParams.set('part', 'snippet');
    ytUrl.searchParams.set('q', q);
    ytUrl.searchParams.set('type', 'video');
    ytUrl.searchParams.set('maxResults', String(maxResults));
    ytUrl.searchParams.set('regionCode', 'KR');
    ytUrl.searchParams.set('relevanceLanguage', 'ko');
    ytUrl.searchParams.set('videoDuration', 'medium'); // 4~20분 영상 위주
    ytUrl.searchParams.set('key', apiKey);

    const ytRes = await fetch(ytUrl.toString());
    if (!ytRes.ok) {
      const errText = await ytRes.text();
      return new Response(JSON.stringify({ error: 'YouTube API 오류', detail: errText }), {
        status: ytRes.status, headers: corsHeaders,
      });
    }

    const data = await ytRes.json();

    // 필요한 필드만 추려서 내려줌 (quota 절약 + 프론트 단순화)
    const items = (data.items || []).map(item => ({
      id: { videoId: item.id?.videoId || '' },
      snippet: {
        title: item.snippet?.title || '',
        channelTitle: item.snippet?.channelTitle || '',
        description: item.snippet?.description || '',
        thumbnails: {
          medium: { url: item.snippet?.thumbnails?.medium?.url || '' },
          high:   { url: item.snippet?.thumbnails?.high?.url   || '' },
        },
        publishedAt: item.snippet?.publishedAt || '',
      },
    })).filter(item => item.id.videoId);

    return new Response(JSON.stringify({ items }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: '서버 오류', detail: String(err) }), {
      status: 500, headers: corsHeaders,
    });
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
