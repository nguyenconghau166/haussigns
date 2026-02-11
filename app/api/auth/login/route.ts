import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (password === adminPassword) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return response;
  }

  return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
}
