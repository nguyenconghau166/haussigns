import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('trusted_brands')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brands: data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = {
      name: body.name,
      logo_url: body.logo_url,
      website_url: body.website_url || null,
      display_order: Number.isFinite(body.display_order) ? body.display_order : 0,
      is_active: body.is_active !== false,
    };
    if (!payload.name || !payload.logo_url) {
      return NextResponse.json({ error: 'name and logo_url are required' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin.from('trusted_brands').insert(payload).select();
    if (error) throw error;
    return NextResponse.json({ brand: data[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const { error } = await supabaseAdmin.from('trusted_brands').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
