'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Edit, Trash, Eye, Loader2, Bot, FileText,
  Search, Filter, ArrowRight, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  featured_image?: string;
  excerpt?: string;
  seo_score?: number;
  created_at: string;
  updated_at?: string;
  tags?: string[];
  lang?: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const res = await fetch('/api/admin/posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (postId: string) => {
    setPublishing(postId);
    try {
      await fetch('/api/admin/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, status: 'published' }),
      });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'published' } : p));
    } catch (error) {
      console.error('Failed to publish:', error);
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      await fetch('/api/admin/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId }),
      });
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const filteredPosts = posts
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const statusCounts = {
    all: posts.length,
    draft: posts.filter(p => p.status === 'draft').length,
    published: posts.filter(p => p.status === 'published').length,
    archived: posts.filter(p => p.status === 'archived').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý bài viết</h1>
          <p className="text-slate-500 mt-1">Kiểm tra, chỉnh sửa và đăng bài viết AI tạo</p>
        </div>
        <Link
          href="/admin/posts/create"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all text-sm"
        >
          <Plus className="h-4 w-4" /> Tạo bài mới
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {(['all', 'draft', 'published', 'archived'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1',
                filter === f
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}
            >
              {f === 'all' ? 'Tất cả' : f === 'draft' ? '📝 Nháp' : f === 'published' ? '✅ Đã đăng' : '📦 Lưu trữ'}
              <span className="ml-1 text-[10px] opacity-70">({statusCounts[f]})</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm bài viết..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">
              {posts.length === 0 ? 'Chưa có bài viết nào' : 'Không tìm thấy bài viết'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {posts.length === 0 ? 'Chạy AI Pipeline để tạo bài viết tự động' : 'Thử thay đổi bộ lọc'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="border-0 shadow-md hover:shadow-lg transition-all overflow-hidden">
              <div className="flex items-center p-5 gap-4">
                {/* Thumbnail */}
                {post.featured_image ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                    <img
                      src={post.featured_image}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as any).style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-slate-300" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 truncate">{post.title}</h3>
                    <span className={cn(
                      'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex-shrink-0',
                      post.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                        post.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-600'
                    )}>
                      {post.status === 'draft' ? 'Nháp' : post.status === 'published' ? 'Đã đăng' : 'Lưu trữ'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {post.excerpt || `/${post.slug}`}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-400">
                      {new Date(post.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    {post.seo_score && (
                      <span className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                        post.seo_score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                          post.seo_score >= 50 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                      )}>
                        SEO: {post.seo_score}
                      </span>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-1">
                        {post.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {post.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(post.id)}
                      disabled={publishing === post.id}
                      className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      {publishing === post.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      Đăng bài
                    </button>
                  )}
                  <Link
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Xem trước"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Xóa"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
