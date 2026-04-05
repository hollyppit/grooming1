// ══════════════════════════════════════
//  /api/mentor-profile — 멘토 프로필 CRUD
// ══════════════════════════════════════
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

async function sb(env, path, opts = {}) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': opts.prefer || 'return=representation',
      ...opts.headers,
    },
    method: opts.method || 'GET',
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

// GET /api/mentor-profile?id=X 또는 전체
export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const path = id
      ? `mentor_profiles?id=eq.${id}`
      : 'mentor_profiles?order=updated_at.desc';
    const data = await sb(env, path);
    return new Response(JSON.stringify(id ? (data[0] || null) : data), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

// POST /api/mentor-profile — 생성
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    const data = await sb(env, 'mentor_profiles', {
      method: 'POST',
      body: {
        name: body.name,
        spec: body.spec || null,
        career: body.career || null,
        intro: body.intro || null,
        avatar_url: body.avatar_url || null,
      },
    });
    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

// PUT /api/mentor-profile — 수정
export async function onRequestPut({ env, request }) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: CORS });
    updates.updated_at = new Date().toISOString();
    const data = await sb(env, `mentor_profiles?id=eq.${id}`, {
      method: 'PATCH',
      body: updates,
    });
    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
