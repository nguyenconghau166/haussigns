'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, ArrowLeft, Loader2, Image as ImageIcon, Wand2 } from 'lucide-react';
import Link from 'next/link';
import RichEditor from '@/components/RichEditor';
import ImageUploader from '@/components/ImageUploader';

export default function EditIndustry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [industry, setIndustry] = useState<any>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [icon, setIcon] = useState('');
  const [image, setImage] = useState('');

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');

  useEffect(() => {
    fetch(`/api/admin/industries/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.industry) {
          setIndustry(data.industry);
          setTitle(data.industry.title);
          setSlug(data.industry.slug);
          setDescription(data.industry.description || '');
          setContent(data.industry.content || '');
          setIcon(data.industry.icon || '');
          setImage(data.industry.image || '');
          setAiTopic(data.industry.title);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/industries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, slug, description, content, icon, image
        })
      });
      alert('Lưu thành công!');
      router.refresh();
    } catch (error) {
      alert('Lỗi khi lưu!');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateContent = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          topic: `Signage solutions for ${aiTopic || title}`,
          lang: 'en',
          tone: 'professional',
          contentType: 'industry'
        })
      });
      const data = await res.json();
      if (data.content) setContent(data.content);
    } catch (e) {
      alert('AI Error');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/industries" className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Chỉnh sửa: {title}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu thay đổi
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên ngành hàng</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-lg h-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nội dung chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <RichEditor value={content} onChange={setContent} placeholder="Nhập nội dung chi tiết..." />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-amber-100 shadow-amber-500/10 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Wand2 className="h-4 w-4 text-amber-600" /> AI Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="w-full mb-3 p-2 text-sm border rounded"
                placeholder="Chủ đề..."
              />
              <button
                onClick={handleGenerateContent}
                disabled={aiLoading}
                className="w-full bg-amber-500 text-white py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                {aiLoading ? 'Đang viết...' : 'Tự động viết nội dung'}
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Hình ảnh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Icon (Lucide Name)</label>
                <input value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full mt-1 p-2 text-sm border rounded" />
              </div>
              <div>
                <ImageUploader
                  label="Ảnh đại diện (Thumbnail)"
                  value={image}
                  onChange={setImage}
                  aspectRatio={4 / 3}
                  maxWidth={1200}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
