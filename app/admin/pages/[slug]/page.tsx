'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Eye, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function EditPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<any>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/pages/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.page) {
          setPage(data.page);
          setTitle(data.page.title);
          setContent(data.page.content || '');
          setMetaTitle(data.page.meta_title || '');
          setMetaDescription(data.page.meta_description || '');
          setFeaturedImage(data.page.featured_image || '');
          setIsPublished(data.page.is_published);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/pages/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          meta_title: metaTitle,
          meta_description: metaDescription,
          featured_image: featuredImage,
          is_published: isPublished
        })
      });
      alert('Đã lưu thành công!');
      router.refresh();
    } catch (error) {
      alert('Lỗi khi lưu!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!page) return <div>Trang không tồn tại</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/pages" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Chỉnh sửa trang: {page.slug}</h1>
            <p className="text-slate-500 text-sm">Cập nhật nội dung và SEO cho trang này</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/${page.slug}`} target="_blank" className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
            <Eye className="h-4 w-4" /> Xem thử
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu thay đổi
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nội dung trang</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề (H1)</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nội dung chính (Markdown / HTML)</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-96 p-4 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">Hỗ trợ Markdown cơ bản (**bold**, # Header, - list)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Meta Title</label>
                <input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                  placeholder="Tiêu đề hiển thị trên Google"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Meta Description</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm h-24"
                  placeholder="Mô tả ngắn gọn (160 ký tự)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hình ảnh đại diện (OG Image)</label>
                <div className="flex gap-2">
                    <input
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm"
                    placeholder="URL hình ảnh"
                    />
                    <button 
                        onClick={() => {
                            const url = prompt('Nhập URL hình ảnh:', featuredImage);
                            if (url) setFeaturedImage(url);
                        }}
                        className="px-3 py-1 bg-slate-100 border rounded text-xs whitespace-nowrap"
                    >
                        Chọn
                    </button>
                </div>
                {featuredImage && (
                  <div className="mt-2 rounded-lg overflow-hidden border bg-slate-50 h-32 flex items-center justify-center">
                    <img src={featuredImage} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Công khai</span>
                <button
                  onClick={() => setIsPublished(!isPublished)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    isPublished ? "bg-emerald-500" : "bg-slate-300"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform ml-1",
                    isPublished ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
