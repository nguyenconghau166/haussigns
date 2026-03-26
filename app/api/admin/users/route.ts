import { NextResponse } from 'next/server';
import { createSupabaseServerAdmin } from '@/lib/supabase-server';
import { requireRole, UserRole } from '@/lib/auth';

// GET /api/admin/users — list all users (owner/admin only)
export async function GET() {
  try {
    await requireRole(['owner', 'admin']);

    const supabaseAdmin = await createSupabaseServerAdmin();
    const { data: users, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    if (message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// PATCH /api/admin/users — update user role/status (owner/admin only)
export async function PATCH(request: Request) {
  try {
    const currentUser = await requireRole(['owner', 'admin']);
    const { userId, role, isActive } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId là bắt buộc' }, { status: 400 });
    }

    // Prevent self-demotion for owner
    if (userId === currentUser.id && currentUser.role === 'owner') {
      if (role && role !== 'owner') {
        return NextResponse.json(
          { error: 'Owner không thể tự hạ quyền' },
          { status: 400 }
        );
      }
    }

    // Only owner can assign owner/admin roles
    if (role === 'owner' && currentUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Chỉ owner mới có thể gán quyền owner' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (role) {
      const validRoles: UserRole[] = ['owner', 'admin', 'editor', 'viewer'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Role không hợp lệ' }, { status: 400 });
      }
      updateData.role = role;
    }
    if (typeof isActive === 'boolean') {
      // Owner cannot be deactivated
      if (!isActive) {
        const supabaseAdmin = await createSupabaseServerAdmin();
        const { data: targetUser } = await supabaseAdmin
          .from('user_profiles')
          .select('role')
          .eq('id', userId)
          .single();
        if (targetUser?.role === 'owner') {
          return NextResponse.json(
            { error: 'Không thể vô hiệu hóa owner' },
            { status: 400 }
          );
        }
      }
      updateData.is_active = isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Không có gì để cập nhật' }, { status: 400 });
    }

    const supabaseAdmin = await createSupabaseServerAdmin();
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    if (message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
