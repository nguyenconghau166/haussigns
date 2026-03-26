import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = await createSupabaseServer();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    );
  }
}
