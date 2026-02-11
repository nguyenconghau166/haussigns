import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('site_pages').select('*').order('slug');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ pages: data });
}

export async function POST(request: Request) {
  // Create new page (if needed later)
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin.from('site_pages').insert(body).select();
    if (error) throw error;
    return NextResponse.json({ page: data[0] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }
}
