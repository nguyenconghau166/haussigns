import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch receipt header
  const { data: receipt, error: receiptError } = await supabaseAdmin
    .from('import_receipts')
    .select('*')
    .eq('id', id)
    .single();

  if (receiptError) return NextResponse.json({ error: receiptError.message }, { status: 500 });

  // Fetch receipt items with material info
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('import_receipt_items')
    .select('*, warehouse_materials(name, sku, unit, category)')
    .eq('receipt_id', id)
    .order('created_at', { ascending: true });

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  return NextResponse.json({ receipt, items });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // First, reverse the stock changes by getting items
  const { data: items } = await supabaseAdmin
    .from('import_receipt_items')
    .select('material_id, quantity')
    .eq('receipt_id', id);

  if (items) {
    for (const item of items) {
      // Subtract stock
      const { data: mat } = await supabaseAdmin
        .from('warehouse_materials')
        .select('stock_quantity')
        .eq('id', item.material_id)
        .single();

      if (mat) {
        await supabaseAdmin
          .from('warehouse_materials')
          .update({ stock_quantity: Math.max(0, (mat.stock_quantity || 0) - item.quantity) })
          .eq('id', item.material_id);
      }
    }
  }

  // Delete receipt (cascade deletes items)
  const { error } = await supabaseAdmin
    .from('import_receipts')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
