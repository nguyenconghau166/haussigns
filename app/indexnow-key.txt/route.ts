import { supabaseAdmin } from '@/lib/supabase';

export const revalidate = 3600;

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
        'Cache-Control': 'public, s-maxage=300',
      },
    });
  }

  return new Response(key, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
