'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Search,
  Settings,
  Bot,
  History,
  ChevronLeft,
  ChevronRight,
  Zap,
  Building2,
  Layers,
  Users,
  TrendingUp,
  Package,
  Link as LinkIcon,
  LogOut,
  UserCog,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Khách hàng (Leads)', href: '/admin/leads', icon: Users },
  { label: 'Quản lý Trang', href: '/admin/pages', icon: FileText },
  { label: 'Quản lý Ngành hàng', href: '/admin/industries', icon: Building2 },
  { label: 'Quản lý Vật liệu', href: '/admin/materials', icon: Layers },
  { label: 'Trusted Brands', href: '/admin/trusted-brands', icon: Building2 },
  { label: 'AI Pipeline', href: '/admin/ai-center', icon: Bot },
  { label: 'Quản lý Sản phẩm (Mới)', href: '/admin/products', icon: Package },
  { label: 'Quản lý Dự án', href: '/admin/projects', icon: Layers },
  { label: 'Quản lý bài viết', href: '/admin/posts', icon: FileText },
  { label: 'Nghiên cứu từ khóa', href: '/admin/keywords', icon: Search },
  { label: 'SEO & AIO', href: '/admin/seo', icon: TrendingUp },
  { label: 'Liên kết nội bộ', href: '/admin/seo/internal-links', icon: LinkIcon },
  { label: 'Lịch sử Pipeline', href: '/admin/pipeline-history', icon: History },
  { label: 'Cài đặt hệ thống', href: '/admin/settings', icon: Settings },
];

// Items only visible to owner/admin
const ADMIN_ONLY_ITEMS = [
  { label: 'Quản lý Người dùng', href: '/admin/users', icon: UserCog },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut, loading } = useAuth();

  const canManageUsers = profile?.role === 'owner' || profile?.role === 'admin';
  const allNavItems = canManageUsers ? [...NAV_ITEMS, ...ADMIN_ONLY_ITEMS] : NAV_ITEMS;

  const ROLE_LABELS: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer',
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/50 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Zap className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide">SignsHaus</h1>
              <p className="text-[10px] text-slate-500 font-medium">AI ADMIN PANEL</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Zap className="h-4 w-4 text-slate-900" />
          </div>
        )}
        {/* Close button for mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-3 mt-2 flex-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">
            Menu chính
          </p>
        )}
        {allNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 shadow-lg shadow-amber-500/5 border border-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-amber-400')} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button — desktop only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 items-center justify-center hover:bg-slate-600 transition-colors shadow-lg"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-slate-300" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-slate-300" />
        )}
      </button>

      {/* User Profile & Logout */}
      <div className={cn('border-t border-slate-800/50', collapsed ? 'p-2' : 'p-3')}>
        {!loading && profile ? (
          <div className={cn(
            'rounded-xl bg-slate-800/50 backdrop-blur border border-slate-700/50',
            collapsed ? 'p-2' : 'p-3'
          )}>
            <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
              {/* Avatar */}
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || profile.email}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-slate-900">
                    {(profile.full_name || profile.email)[0].toUpperCase()}
                  </span>
                </div>
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {profile.full_name || profile.email}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {ROLE_LABELS[profile.role] || profile.role}
                  </p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={signOut}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Đăng xuất
              </button>
            )}
            {collapsed && (
              <button
                onClick={signOut}
                className="w-full mt-2 flex items-center justify-center p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className={cn(
            'rounded-xl bg-slate-800/50 backdrop-blur border border-slate-700/50',
            collapsed ? 'p-2' : 'p-4'
          )}>
            <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
              <div className="relative">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </div>
              {!collapsed && (
                <div>
                  <span className="text-xs font-semibold text-slate-300">Hệ thống Online</span>
                  <p className="text-[10px] text-slate-500">AI Pipeline sẵn sàng</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-slate-950 border-b border-slate-800/50 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-slate-900" />
          </div>
          <span className="text-sm font-bold text-white">SignsHaus</span>
        </div>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — mobile: slide-in drawer, desktop: fixed */}
      <div
        className={cn(
          // Desktop
          'hidden lg:flex fixed inset-y-0 left-0 z-40 border-r bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl transition-all duration-300 flex-col',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent}
      </div>

      {/* Mobile sidebar drawer */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
