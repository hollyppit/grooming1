// ══════════════════════════════════════
//  /api/mentors — 멘토 신청 CRUD
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

// GET /api/mentors?status=approved
export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const id = url.searchParams.get('id');
    let path = 'mentor_apps?order=applied_at.desc';
    if (status) path += `&status=eq.${status}`;
    if (id) path = `mentor_apps?id=eq.${id}`;
    const data = await sb(env, path);
    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

// POST /api/mentors — 신규 신청
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    const data = await sb(env, 'mentor_apps', {
      method: 'POST',
      body: {
        name: body.name,
        phone: body.phone,
        spec: body.spec,
        career: body.career,
        intro: body.intro,
        yt_urls: body.ytUrls || [],
        cert_files: body.certFiles || [],
        port_files: body.portFiles || [],
        styles: [],
        status: 'pending',
      },
    });
    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

// PUT /api/mentors — 상태 변경, styles 업데이트
export async function onRequestPut({ env, request }) {
  try {
    const { id, status, styles } = await request.json();
    if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: CORS });
    const updates = {};
    if (status) updates.status = status;
    if (styles !== undefined) updates.styles = styles;
    const data = await sb(env, `mentor_apps?id=eq.${id}`, {
      method: 'PATCH',
      body: updates,
    });
    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

// DELETE /api/mentors?id=X
export async function onRequestDelete({ env, request }) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: CORS });
    await sb(env, `mentor_apps?id=eq.${id}`, { method: 'DELETE' });
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
