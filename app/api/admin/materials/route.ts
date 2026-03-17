import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { enforcePublishGate } from '@/lib/publish-gate';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ materials: data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.is_published === true) {
      const gate = await enforcePublishGate({
        title: body.name || '',
        description: body.description || '',
        content: body.content || '',
        contentType: 'material',
        entityTable: 'materials'
      });

      if (!gate.allowed) {
        return NextResponse.json({
          error: `Publish blocked: Content quality score ${gate.qa.overall} is below required ${gate.minScore}.`,
          qa: gate.qa,
          minScore: gate.minScore
        }, { status: 422 });
      }
    }

    const { data, error } = await supabaseAdmin.from('materials').insert(body).select();
    if (error) throw error;
    return NextResponse.json({ material: data[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        const { error } = await supabaseAdmin.from('materials').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
