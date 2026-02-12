import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: List all leads
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data });
}

// POST: Create new lead (Public)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, type, message, file_url } = body;

    const { error } = await supabaseAdmin
      .from('leads')
      .insert([{
        name,
        phone,
        email,
        type,
        message,
        file_url
      }]);

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Update status
export async function PATCH(request: Request) {
    try {
        const { id, status, notes } = await request.json();
        const { error } = await supabaseAdmin.from('leads').update({ status, notes }).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
