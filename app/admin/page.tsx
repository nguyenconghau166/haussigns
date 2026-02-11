'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  FileText, Search, Activity, Bot, Play, Clock,
  CheckCircle, AlertCircle, TrendingUp, ArrowRight,
  Zap, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    draftPosts: 0,
    publishedPosts: 0,
    pipelineRuns: 0,
    lastRunTime: null as string | null,
    lastRunStatus: null as string | null,
  });
  const [recentDrafts, setRecentDrafts] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch posts
      const postsRes = await fetch('/api/admin/posts');
      const postsData = await postsRes.json();
      const posts = postsData.posts || [];

      // Fetch pipeline history
      const historyRes = await fetch('/api/admin/pipeline/history?limit=5');
      const historyData = await historyRes.json();
      const runs = historyData.runs || [];

      setStats({
        totalPosts: posts.length,
        draftPosts: posts.filter((p: any) => p.status === 'draft').length,
        publishedPosts: posts.filter((p: any) => p.status === 'published').length,
        pipelineRuns: runs.length,
        lastRunTime: runs[0]?.started_at || null,
        lastRunStatus: runs[0]?.status || null,
      });

      setRecentDrafts(posts.filter((p: any) => p.status === 'draft').slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Tổng bài viết',
      value: stats.totalPosts,
      icon: FileText,
      change: `${stats.publishedPosts} đã đăng`,
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Bài nháp chờ duyệt',
      value: stats.draftPosts,
      icon: Clock,
      change: 'Cần kiểm tra & đăng bài',
      color: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Pipeline đã chạy',
      value: stats.pipelineRuns,
      icon: Bot,
      change: stats.lastRunStatus ? `Lần cuối: ${stats.lastRunStatus}` : 'Chưa chạy',
      color: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'AI Status',
      value: 'Sẵn sàng',
      icon: Zap,
      change: '4 agents online',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-50 text-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Tổng quan hệ thống AI viết bài tự động</p>
        </div>
        <Link
          href="/admin/ai-center"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-200"
        >
          <Play className="h-4 w-4" />
          Chạy AI Pipeline
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-2">{stat.change}</p>
                </div>
                <div className={cn('p-3 rounded-xl', stat.iconBg)}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className={cn('h-1 w-full rounded-full mt-4 bg-gradient-to-r', stat.color, 'opacity-20 group-hover:opacity-100 transition-opacity')} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Pipeline Flow Preview */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg">Quy trình AI viết bài</CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                4 AI Agents làm việc tuần tự để tạo nội dung chất lượng
              </CardDescription>
            </div>
            <Link href="/admin/ai-center" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
              Chi tiết <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-4">
            {[
              { step: 1, name: 'Nghiên cứu', desc: 'Từ khóa & tin tức', icon: Search, color: 'purple' },
              { step: 2, name: 'Đánh giá', desc: 'Lọc & chấm điểm', icon: TrendingUp, color: 'blue' },
              { step: 3, name: 'Viết bài', desc: 'SEO + CTA', icon: FileText, color: 'amber' },
              { step: 4, name: 'Hình ảnh', desc: 'Tạo ảnh minh họa', icon: Eye, color: 'emerald' },
            ].map((agent, idx) => (
              <div key={agent.step} className="relative">
                <div className={cn(
                  'flex flex-col items-center text-center p-4 rounded-xl border-2 border-dashed',
                  `border-${agent.color}-200 bg-${agent.color}-50/50`
                )} style={{
                  borderColor: agent.color === 'purple' ? '#e9d5ff' : agent.color === 'blue' ? '#bfdbfe' : agent.color === 'amber' ? '#fde68a' : '#a7f3d0',
                  backgroundColor: agent.color === 'purple' ? '#faf5ff' : agent.color === 'blue' ? '#eff6ff' : agent.color === 'amber' ? '#fffbeb' : '#ecfdf5',
                }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{
                    backgroundColor: agent.color === 'purple' ? '#f3e8ff' : agent.color === 'blue' ? '#dbeafe' : agent.color === 'amber' ? '#fef3c7' : '#d1fae5',
                    color: agent.color === 'purple' ? '#9333ea' : agent.color === 'blue' ? '#2563eb' : agent.color === 'amber' ? '#d97706' : '#059669',
                  }}>
                    <agent.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-500">Agent {agent.step}</span>
                  <span className="text-sm font-semibold text-slate-800 mt-0.5">{agent.name}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">{agent.desc}</span>
                </div>
                {idx < 3 && (
                  <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Drafts & Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Drafts */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Bài nháp chờ duyệt</CardTitle>
              <CardDescription>Bài viết AI tạo, cần kiểm tra trước khi đăng</CardDescription>
            </div>
            <Link href="/admin/posts" className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentDrafts.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Chưa có bài nháp nào.</p>
                <p className="text-xs text-slate-400 mt-1">Chạy AI Pipeline để tạo bài viết mới</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDrafts.map((post) => (
                  <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{post.title}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(post.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-md text-[10px] font-semibold uppercase bg-amber-100 text-amber-700">
                      Nháp
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Hành động nhanh</CardTitle>
            <CardDescription>Các thao tác thường dùng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/admin/ai-center"
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Chạy AI Pipeline</p>
                <p className="text-xs text-slate-500">Nghiên cứu, đánh giá, viết bài tự động</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
            </Link>
            <Link
              href="/admin/posts/create"
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Viết bài thủ công</p>
                <p className="text-xs text-slate-500">Tạo bài viết mới với hỗ trợ AI</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
            </Link>
            <Link
              href="/admin/keywords"
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Nghiên cứu từ khóa</p>
                <p className="text-xs text-slate-500">Tìm cơ hội nội dung mới</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Cài đặt hệ thống</p>
                <p className="text-xs text-slate-500">Cấu hình AI, doanh nghiệp, SEO</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
