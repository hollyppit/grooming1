// ══════════════════════════════════════
//  /api/favorites — 즐겨찾기 CRUD
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

// GET /api/favorites
export async function onRequestGet({ env }) {
  try {
    const data = await sb(env, 'favorites?order=sort_order.asc');
    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

// POST /api/favorites — 추가
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    const data = await sb(env, 'favorites', {
      method: 'POST',
      body: {
        id: body.id,
        type: body.type,
        title: body.title || null,
        channel: body.channel || null,
        mentor_name: body.mentor_name || null,
        thumb: body.thumb || null,
        video_id: body.video_id || null,
        video_url: body.video_url || null,
        folder_id: body.folder_id || null,
        parent_id: body.parent_id || null,
        name: body.name || null,
        sort_order: body.sort_order || 0,
      },
      prefer: 'return=representation,resolution=merge-duplicates',
    });
    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

// PUT /api/favorites — 수정 (이름, 순서, 폴더 이동)
export async function onRequestPut({ env, request }) {
  try {
    const body = await request.json();

    // 배치 업데이트 (순서 변경 등)
    if (Array.isArray(body.items)) {
      for (const item of body.items) {
        const { id, ...updates } = item;
        await sb(env, `favorites?id=eq.${id}`, { method: 'PATCH', body: updates });
      }
      return new Response(JSON.stringify({ ok: true }), { headers: CORS });
    }

    // 단일 업데이트
    const { id, ...updates } = body;
    if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: CORS });
    const data = await sb(env, `favorites?id=eq.${id}`, { method: 'PATCH', body: updates });
    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

// DELETE /api/favorites?id=X
export async function onRequestDelete({ env, request }) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: CORS });
    // 폴더 삭제 시 하위 아이템의 folder_id를 null로
    await sb(env, `favorites?folder_id=eq.${id}`, {
      method: 'PATCH',
      body: { folder_id: null },
    });
    await sb(env, `favorites?id=eq.${id}`, { method: 'DELETE' });
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
