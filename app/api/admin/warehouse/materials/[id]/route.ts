import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, sku, unit, category, min_stock, unit_price, note, is_active } = body;

  const { data, error } = await supabaseAdmin
    .from('warehouse_materials')
    .update({ name, sku, unit, category, min_stock, unit_price, note, is_active })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ material: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from('warehouse_materials')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
