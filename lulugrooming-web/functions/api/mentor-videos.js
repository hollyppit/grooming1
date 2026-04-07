// ══════════════════════════════════════
//  /api/mentor-videos — 멘토 영상 메타 CRUD
// ══════════════════════════════════════
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

async function sb(env, path, opts = {}) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': opts.prefer || 'return=representation',
      ...opts.headers,
    },
    method: opts.method || 'GET',
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

// GET /api/mentor-videos?mentor_id=X
export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const mentorId = url.searchParams.get('mentor_id');
    const path = mentorId
      ? `mentor_videos?mentor_id=eq.${mentorId}&order=sort_order.asc`
      : 'mentor_videos?order=sort_order.asc';
    const data = await sb(env, path);
    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

// POST /api/mentor-videos — 생성 또는 reorder
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();

    // 순서 재정렬 모드
    if (body.reorder && Array.isArray(body.items)) {
      for (const item of body.items) {
        await sb(env, `mentor_videos?id=eq.${item.id}`, {
          method: 'PATCH',
          body: { sort_order: item.sort_order },
        });
      }
      return new Response(JSON.stringify({ ok: true }), { headers: CORS });
    }

    // 신규 생성
    const data = await sb(env, 'mentor_videos', {
      method: 'POST',
      body: {
        mentor_id: body.mentor_id,
        title: body.title || '',
        comment: body.comment || '',
        video_url: body.video_url || '',
        sort_order: body.sort_order || 0,
      },
    });
    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

// PUT /api/mentor-videos — title, comment 수정
export async function onRequestPut({ env, request }) {
  try {
    const { id, title, comment } = await request.json();
    if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: CORS });
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (comment !== undefined) updates.comment = comment;
    const data = await sb(env, `mentor_videos?id=eq.${id}`, {
      method: 'PATCH',
      body: updates,
    });
    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

// DELETE /api/mentor-videos?id=X
export async function onRequestDelete({ env, request }) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: CORS });
    await sb(env, `mentor_videos?id=eq.${id}`, { method: 'DELETE' });
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
