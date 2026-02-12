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
  PenTool,
  Building2,
  Layers,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Khách hàng (Leads)', href: '/admin/leads', icon: Users },
  { label: 'Quản lý Trang', href: '/admin/pages', icon: FileText },
  { label: 'Quản lý Ngành hàng', href: '/admin/industries', icon: Building2 },
  { label: 'Quản lý Vật liệu', href: '/admin/materials', icon: Layers },
  { label: 'AI Pipeline', href: '/admin/ai-center', icon: Bot },
  { label: 'Viết mô tả SP', href: '/admin/product-writer', icon: PenTool },
  { label: 'Quản lý bài viết', href: '/admin/posts', icon: FileText },
  { label: 'Nghiên cứu từ khóa', href: '/admin/keywords', icon: Search },
  { label: 'Lịch sử Pipeline', href: '/admin/pipeline-history', icon: History },
  { label: 'Cài đặt hệ thống', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'fixed inset-y-0 left-0 z-40 border-r bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
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
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-3 mt-2">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">
            Menu chính
          </p>
        )}
        {NAV_ITEMS.map((item) => {
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

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-slate-600 transition-colors shadow-lg"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-slate-300" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-slate-300" />
        )}
      </button>

      {/* Bottom Status */}
      <div className={cn('absolute bottom-4 left-3 right-3', collapsed && 'left-2 right-2')}>
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
      </div>
    </div>
  );
}
