import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { enforcePublishGate } from '@/lib/publish-gate';

// GET: Fetch page by slug
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { data, error } = await supabaseAdmin.from('site_pages').select('*').eq('slug', slug).single();
  
  if (error || !data) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  return NextResponse.json({ page: data });
}

// PUT: Update page
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    if (body.is_published === true) {
      const gate = await enforcePublishGate({
        title: body.title || slug,
        description: body.meta_description || '',
        content: body.content || '',
        metaTitle: body.meta_title || '',
        metaDescription: body.meta_description || '',
        contentType: 'page',
        entityId: slug,
        entityTable: 'site_pages'
      });

      if (!gate.allowed) {
        return NextResponse.json({
          error: `Publish blocked: Content quality score ${gate.qa.overall} is below required ${gate.minScore}.`,
          qa: gate.qa,
          minScore: gate.minScore
        }, { status: 422 });
      }
    }
    
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
