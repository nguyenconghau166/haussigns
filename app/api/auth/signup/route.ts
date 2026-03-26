import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      message: 'Đăng ký thành công! Kiểm tra email để xác nhận tài khoản.',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    );
  }
}
