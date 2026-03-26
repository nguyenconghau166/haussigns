import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('warehouse_materials')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ materials: data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, sku, unit, category, min_stock, unit_price, note } = body;

  if (!name || !unit) {
    return NextResponse.json({ error: 'Tên và đơn vị tính là bắt buộc' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('warehouse_materials')
    .insert([{ name, sku, unit, category, min_stock: min_stock || 0, unit_price: unit_price || 0, note }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ material: data });
}
