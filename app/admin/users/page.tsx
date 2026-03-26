'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/admin/AuthProvider';
import {
  Users, Shield, ShieldCheck, Edit3, Eye, Crown,
  ToggleLeft, ToggleRight, AlertCircle, CheckCircle,
  Search, UserCog
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ROLE_CONFIG = {
  owner: {
    label: 'Owner',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Crown,
    desc: 'Toàn quyền hệ thống',
  },
  admin: {
    label: 'Admin',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: ShieldCheck,
    desc: 'Quản lý users & nội dung',
  },
  editor: {
    label: 'Editor',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Edit3,
    desc: 'Tạo & chỉnh sửa nội dung',
  },
  viewer: {
    label: 'Viewer',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: Eye,
    desc: 'Chỉ xem dashboard',
  },
};

export default function UsersPage() {
  const { profile: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setError(data.error || 'Không thể tải danh sách users');
      }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: { role?: string; isActive?: boolean }) => {
    setUpdatingId(userId);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u))
        );
        setSuccess('Cập nhật thành công');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Cập nhật thất bại');
      }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    admins: users.filter((u) => u.role === 'owner' || u.role === 'admin').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Quản lý Người dùng</h1>
        <p className="text-slate-500 mt-1">Quản lý tài khoản và phân quyền truy cập hệ thống</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Tổng người dùng</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Đang hoạt động</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.active}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Quản trị viên</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.admins}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <Shield className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-emerald-600">{success}</p>
        </div>
      )}

      {/* User List */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCog className="h-5 w-5 text-slate-500" />
              Danh sách người dùng
            </CardTitle>
            <CardDescription>Thay đổi vai trò và trạng thái tài khoản</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none w-64 text-slate-900"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const roleConfig = ROLE_CONFIG[user.role];
              const RoleIcon = roleConfig.icon;
              const isCurrentUser = currentUser?.id === user.id;
              const isUpdating = updatingId === user.id;

              return (
                <div
                  key={user.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border transition-all',
                    user.is_active
                      ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      : 'bg-slate-50 border-slate-200 opacity-60',
                    isCurrentUser && 'ring-2 ring-amber-200 border-amber-300'
                  )}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || user.email}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-600">
                          {(user.full_name || user.email)[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {user.full_name || 'Chưa đặt tên'}
                      </p>
                      {isCurrentUser && (
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                          Bạn
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tham gia: {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  {/* Role Badge */}
                  <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold', roleConfig.color)}>
                    <RoleIcon className="h-3.5 w-3.5" />
                    {roleConfig.label}
                  </div>

                  {/* Role Selector (if not self and not owner target) */}
                  {!isCurrentUser && user.role !== 'owner' && (
                    <select
                      value={user.role}
                      onChange={(e) => updateUser(user.id, { role: e.target.value })}
                      disabled={isUpdating}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:border-amber-400 outline-none disabled:opacity-50 text-slate-700"
                    >
                      {currentUser?.role === 'owner' && (
                        <option value="admin">Admin</option>
                      )}
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  )}

                  {/* Active Toggle */}
                  {!isCurrentUser && user.role !== 'owner' && (
                    <button
                      onClick={() => updateUser(user.id, { isActive: !user.is_active })}
                      disabled={isUpdating}
                      className={cn(
                        'flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50',
                        user.is_active
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          : 'text-red-700 bg-red-50 hover:bg-red-100'
                      )}
                    >
                      {user.is_active ? (
                        <>
                          <ToggleRight className="h-4 w-4" />
                          Hoạt động
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4" />
                          Đã khóa
                        </>
                      )}
                    </button>
                  )}

                  {isUpdating && (
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Không tìm thấy người dùng nào</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Explanation */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Mô tả quyền hạn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(ROLE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className={cn('p-2 rounded-lg', config.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{config.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{config.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
