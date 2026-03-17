import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { enforcePublishGate } from '@/lib/publish-gate';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('industries')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ industry: data });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { data: existing } = await supabaseAdmin
      .from('industries')
      .select('is_published')
      .eq('id', id)
      .single();

    if (body.is_published === true || existing?.is_published === true) {
      const gate = await enforcePublishGate({
        title: body.title || '',
        description: body.description || '',
        content: body.content || '',
        contentType: 'industry',
        entityId: id,
        entityTable: 'industries'
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
      .from('industries')
      .update(body)
      .eq('id', id);
      
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
