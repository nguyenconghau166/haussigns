import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getDbKey(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('ai_config')
    .select('value')
    .eq('key', 'indexnow_key')
    .single();

  return data?.value || null;
}

export async function GET() {
  const key = (await getDbKey()) || process.env.INDEXNOW_KEY;

  if (!key) {
    return new Response('IndexNow key is not configured', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }

  return new Response(key, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
