// ══════════════════════════════════════
//  /api/mentor-upload — Supabase Storage 파일 업로드
// ══════════════════════════════════════
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// POST /api/mentor-upload
// FormData: file, bucket (mentor-avatars|mentor-videos|mentor-files), mentor_id
export async function onRequestPost({ env, request }) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const bucket = formData.get('bucket') || 'mentor-files';
    const mentorId = formData.get('mentor_id') || 'default';

    if (!file || !file.name) {
      return new Response(JSON.stringify({ error: 'file required' }), { status: 400, headers: CORS });
    }

    // 사이즈 제한
    const maxSize = bucket === 'mentor-videos' ? 500 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: `파일 크기 초과 (최대 ${maxSize / 1024 / 1024}MB)` }),
        { status: 400, headers: CORS }
      );
    }

    // 파일명 생성: mentorId/timestamp_원본파일명
    const ext = file.name.split('.').pop();
    const fileName = `${mentorId}/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;

    // Supabase Storage 업로드
    const arrayBuffer = await file.arrayBuffer();
    const uploadRes = await fetch(
      `${env.SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`,
      {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': file.type,
          'x-upsert': 'true',
        },
        body: arrayBuffer,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return new Response(JSON.stringify({ error: 'Upload failed', detail: err }), { status: 500, headers: CORS });
    }

    // 공개 URL 생성
    const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`;

    return new Response(JSON.stringify({
      url: publicUrl,
      fileName,
      bucket,
      size: file.size,
      type: file.type,
    }), { headers: CORS });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
