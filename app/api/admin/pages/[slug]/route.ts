import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Fetch page by slug
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { data, error } = await supabaseAdmin.from('site_pages').select('*').eq('slug', slug).single();
  
  if (error || !data) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  return NextResponse.json({ page: data });
}

// PUT: Update page
export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    
    const { error } = await supabaseAdmin
      .from('site_pages')
      .update(body)
      .eq('slug', slug);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}
