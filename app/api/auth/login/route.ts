import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    // Check if user profile is active
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_active, role')
      .eq('id', data.user.id)
      .single();

    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, error: 'Tài khoản đã bị vô hiệu hóa. Liên hệ admin.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile?.role || 'viewer',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    );
  }
}
