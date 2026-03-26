import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('import_receipts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ receipts: data });
}

// Generate receipt code: PN-YYYYMMDD-XXX
async function generateReceiptCode(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `PN-${dateStr}`;

  const { data } = await supabaseAdmin
    .from('import_receipts')
    .select('receipt_code')
    .like('receipt_code', `${prefix}%`)
    .order('receipt_code', { ascending: false })
    .limit(1);

  let seq = 1;
  if (data && data.length > 0) {
    const lastCode = data[0].receipt_code;
    const lastSeq = parseInt(lastCode.split('-').pop() || '0', 10);
    seq = lastSeq + 1;
  }

  return `${prefix}-${String(seq).padStart(3, '0')}`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { supplier, receipt_date, note, items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Phiếu nhập phải có ít nhất 1 vật tư' }, { status: 400 });
  }

  // Generate receipt code
  const receipt_code = await generateReceiptCode();

  // Calculate total
  const total_amount = items.reduce((sum: number, item: { quantity: number; unit_price: number }) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);

  // Insert receipt header
  const { data: receipt, error: receiptError } = await supabaseAdmin
    .from('import_receipts')
    .insert([{
      receipt_code,
      receipt_date: receipt_date || new Date().toISOString().slice(0, 10),
      supplier: supplier || '',
      total_amount,
      note: note || '',
      status: 'confirmed',
    }])
    .select()
    .single();

  if (receiptError) {
    return NextResponse.json({ error: receiptError.message }, { status: 500 });
  }

  // Insert receipt items
  const receiptItems = items.map((item: { material_id: string; quantity: number; unit_price: number; note?: string }) => ({
    receipt_id: receipt.id,
    material_id: item.material_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    note: item.note || '',
  }));

  const { error: itemsError } = await supabaseAdmin
    .from('import_receipt_items')
    .insert(receiptItems);

  if (itemsError) {
    // Rollback receipt if items fail
    await supabaseAdmin.from('import_receipts').delete().eq('id', receipt.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ receipt });
}
