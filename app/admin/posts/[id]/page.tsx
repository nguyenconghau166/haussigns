'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import RichEditor from '@/components/RichEditor';
import ImageUploader from '@/components/ImageUploader';

interface PostEditorProps {
  params: Promise<{ id: string }>;
}

interface PostForm {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  meta_title: string;
  meta_description: string;
  status: 'draft' | 'published' | 'archived';
  category_id: string | null;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

const EMPTY_FORM: PostForm = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  featured_image: '',
  meta_title: '',
  meta_description: '',
  status: 'draft',
  category_id: null
};

export default function PostEditorPage({ params }: PostEditorProps) {
  const { id } = use(params);
  const router = useRouter();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [form, setForm] = useState<PostForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // Fetch post and categories in parallel
        const [postRes, catRes] = await Promise.all([
          fetch(`/api/admin/posts/${id}`),
          fetch('/api/admin/categories?type=blog')
        ]);
        const postData = await postRes.json();
        const catData = await catRes.json();

        if (!postRes.ok || !postData.post) {
          throw new Error(postData.error || 'Khong tim thay bai viet');
        }

        setForm({
          title: postData.post.title || '',
          slug: postData.post.slug || '',
          content: postData.post.content || '',
          excerpt: postData.post.excerpt || '',
          featured_image: postData.post.featured_image || '',
          meta_title: postData.post.meta_title || postData.post.title || '',
          meta_description: postData.post.meta_description || postData.post.excerpt || '',
          status: postData.post.status || 'draft',
          category_id: postData.post.category_id || null
        });
        setCategories(catData.categories || []);
      } catch (error) {
        console.error('Failed to load post:', error);
        toastError('Không thể tải bài viết. Vui lòng thử lại.');
        router.push('/admin/posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, router]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const updateField = <K extends keyof PostForm>(key: K, value: PostForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const savePost = async (nextStatus?: PostForm['status']) => {
    if (!form.title || !form.content) {
      toastWarning('Cần có tiêu đề và nội dung.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.title),
        status: nextStatus || form.status
      };

      const res = await fetch(`/api/admin/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Khong the luu bai viet');
      }

      setForm((prev) => ({ ...prev, status: data.post?.status || payload.status, slug: data.post?.slug || payload.slug }));
      setDirty(false);
      toastSuccess(nextStatus === 'published' ? 'Đã đăng bài thành công.' : 'Đã lưu bản nháp.');

      if (nextStatus === 'published') {
        router.push('/admin/posts');
      }
    } catch (error) {
      console.error('Failed to save post:', error);
      toastError('Lưu bài thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/posts" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-4 w-4 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Chinh sua bai viet</h1>
            <p className="text-sm text-slate-500">Review noi dung AI, thay anh va sua cau tu truoc khi dang.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => savePost('draft')}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Luu nhap
          </button>
          <button
            type="button"
            onClick={() => savePost('published')}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="h-4 w-4" /> Dang bai
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader>
            <CardTitle>Noi dung bai viet</CardTitle>
            <CardDescription>Bai AI tao se o trang thai draft de ban review va chinh sua.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tieu de</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Tu dong tao neu de trong"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Noi dung</label>
              <RichEditor value={form.content} onChange={(value) => updateField('content', value)} className="min-h-[420px]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md h-fit">
          <CardHeader>
            <CardTitle>Hinh anh & SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUploader
              value={form.featured_image}
              onChange={(value) => updateField('featured_image', value)}
              label="Anh thumb / featured"
              aspectRatio={16 / 9}
              maxWidth={1200}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={form.category_id || ''}
                onChange={(e) => updateField('category_id', e.target.value || null)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Excerpt</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => updateField('excerpt', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[90px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meta title</label>
              <input
                type="text"
                value={form.meta_title}
                onChange={(e) => updateField('meta_title', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meta description</label>
              <textarea
                value={form.meta_description}
                onChange={(e) => updateField('meta_description', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[90px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
