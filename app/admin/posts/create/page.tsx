'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Wand2, Image as ImageIcon, Save, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

import RichEditor from '@/components/RichEditor';
import ImageUploader from '@/components/ImageUploader';

export default function CreatePostPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const [topic, setTopic] = useState('');
  const [lang, setLang] = useState('en');
  const [tone, setTone] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!topic.trim()) errs.topic = 'Vui lòng nhập tiêu đề bài viết';
    if (!content.trim() || content.replace(/<[^>]*>/g, '').trim().length < 50) {
      errs.content = 'Nội dung bài viết phải có ít nhất 50 ký tự';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toastWarning('Vui lòng nhập topic trước khi generate');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, lang, tone, contentType: 'post' }),
      });
      const data = await res.json();
      if (data.content) {
        setContent(data.content);
        setImagePrompt(`Modern 3D signage of ${topic}, photorealistic, high detail, sunny weather, 8k resolution`);
        toastSuccess('Nội dung đã được tạo thành công!');
      } else {
        toastError(data.error || 'Không thể tạo nội dung');
      }
    } catch (err) {
      console.error(err);
      toastError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
        toastSuccess('Hình ảnh đã được tạo!');
      } else {
        toastError('Không thể tạo hình ảnh');
      }
    } catch (err) {
      console.error(err);
      toastError('Lỗi tạo hình ảnh.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!validate()) {
      toastWarning('Vui lòng kiểm tra lại thông tin');
      return;
    }
    setSaving(true);
    try {
      const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const excerpt = content.substring(0, 150).replace(/<[^>]*>?/gm, '') + '...';

      // Check for duplicate slug
      const checkRes = await fetch(`/api/admin/posts?slug=${encodeURIComponent(slug)}`);
      const checkData = await checkRes.json();
      const existingPost = (checkData.posts || []).find((p: any) => p.slug === slug);
      if (existingPost) {
        toastError(`Slug "${slug}" đã tồn tại. Vui lòng đổi tiêu đề.`);
        setSaving(false);
        return;
      }

      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic,
          slug,
          content,
          excerpt,
          featured_image: imageUrl,
          status,
          lang,
        }),
      });

      if (res.ok) {
        toastSuccess(status === 'published' ? 'Bài viết đã được đăng!' : 'Bài nháp đã được lưu!');
        router.push('/admin/posts');
      } else {
        const errData = await res.json().catch(() => ({}));
        toastError(errData.error || 'Lưu bài viết thất bại');
      }
    } catch (err) {
      console.error(err);
      toastError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Configuration</CardTitle>
            <CardDescription>Configure the writer agent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Topic / Keyword</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => { setTopic(e.target.value); setErrors(prev => ({ ...prev, topic: '' })); }}
                className={`mt-1 w-full rounded-md shadow-sm p-2 border ${errors.topic ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-300'}`}
                placeholder="e.g. Acrylic Build Up"
              />
              {errors.topic && <p className="text-xs text-red-500 mt-1">{errors.topic}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Language</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="mt-1 w-full rounded-md border-slate-300 shadow-sm p-2 border"
              >
                <option value="en">English (Professional)</option>
                <option value="tl">Tagalog (Conversational)</option>
                <option value="mix">Taglish (Local vibe)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="mt-1 w-full rounded-md border-slate-300 shadow-sm p-2 border"
              >
                <option value="professional">Professional Expert</option>
                <option value="persuasive">Persuasive Sales</option>
                <option value="educational">Educational / How-to</option>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !topic}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded-md hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Generate Draft
            </button>
          </CardContent>
        </Card>

        {content && (
          <Card>
            <CardHeader>
              <CardTitle>Visuals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Image Prompt</label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  className="mt-1 w-full rounded-md border-slate-300 shadow-sm p-2 border h-24 text-xs"
                />
              </div>
              <button
                onClick={handleGenerateImage}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-900 border py-2 rounded-md hover:bg-slate-200 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                Generate Image (DALL-E 3)
              </button>
              <div className="mt-4 border-t pt-4">
                <ImageUploader
                  value={imageUrl}
                  onChange={setImageUrl}
                  label="Featured Image (Upload or AI Generated)"
                  aspectRatio={16 / 9}
                  maxWidth={1200}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Content Editor</CardTitle>
              {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSave('draft')}
                disabled={saving || !content}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> Save Draft
              </button>
              <button
                onClick={() => handleSave('published')}
                disabled={saving || !content}
                className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                Publish
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <RichEditor
              value={content}
              onChange={(val) => { setContent(val); setErrors(prev => ({ ...prev, content: '' })); }}
              placeholder="AI generated content will appear here..."
              className="h-full"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
