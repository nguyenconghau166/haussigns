'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, ArrowLeft, Loader2, Wand2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import RichEditor from '@/components/RichEditor';
import ImageUploader from '@/components/ImageUploader';
import AIBriefPanel, { defaultAIBrief } from '@/components/admin/AIBriefPanel';
import ContentQualityCard from '@/components/admin/ContentQualityCard';
import NonBlogSeoTemplatePanel from '@/components/admin/NonBlogSeoTemplatePanel';

export default function EditIndustry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === 'create' || id === 'new';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [image, setImage] = useState('');
  const [recommended, setRecommended] = useState<string[]>([]);

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiBrief, setAiBrief] = useState(defaultAIBrief);
  const [seoPromptTemplate, setSeoPromptTemplate] = useState('');
  const [qaSignal, setQaSignal] = useState(0);

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }

    fetch(`/api/admin/industries/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.industry) {
          setTitle(data.industry.title);
          setSlug(data.industry.slug);
          setDescription(data.industry.description || '');
          setContent(data.industry.content || '');
          setMetaTitle(data.industry.meta_title || '');
          setMetaDescription(data.industry.meta_description || '');
          setIcon(data.industry.icon || '');
          setImage(data.industry.image || '');
          setRecommended(Array.isArray(data.industry.recommended) ? data.industry.recommended : []);
          setAiTopic(data.industry.title);
        }
      })
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title,
        slug: slug || slugify(title),
        description,
        content,
        meta_title: metaTitle,
        meta_description: metaDescription,
        icon,
        image,
        recommended
      };

      const res = await fetch(isNew ? '/api/admin/industries' : `/api/admin/industries/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Lỗi khi lưu!');
        return;
      }
      alert(isNew ? 'Tạo mới thành công!' : 'Lưu thành công!');
      if (isNew) {
        router.push('/admin/industries');
      } else {
        router.refresh();
      }
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `Signage solutions for ${aiTopic || title}`,
          lang: 'en',
          tone: 'professional',
          contentType: 'industry',
          aiBrief,
          seoPromptTemplate
        })
      });
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.content) setContent(data.content);
      if (data.meta_title) setMetaTitle(data.meta_title);
      if (data.meta_description) setMetaDescription(data.meta_description);
      if (Array.isArray(data.recommended_solutions) && data.recommended_solutions.length > 0) {
        setRecommended(data.recommended_solutions);
      }
      if (data.content || data.description || data.title) {
        setQaSignal((prev) => prev + 1);
      }
    } catch (e) {
      alert('AI Error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleRecommendedChange = (index: number, value: string) => {
    const next = [...recommended];
    next[index] = value;
    setRecommended(next);
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/industries" className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{isNew ? 'Tạo ngành hàng mới' : `Chỉnh sửa: ${title}`}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isNew ? 'Tạo ngành hàng' : 'Lưu thay đổi'}
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

              <div>
                <label className="block text-sm font-medium mb-2">Recommended Signage</label>
                <div className="space-y-2">
                  {recommended.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        value={item}
                        onChange={(e) => handleRecommendedChange(index, e.target.value)}
                        className="flex-1 p-2 border rounded-lg text-sm"
                        placeholder="e.g. LED Channel Letters"
                      />
                      <button
                        type="button"
                        onClick={() => setRecommended(recommended.filter((_, i) => i !== index))}
                        className="text-red-500"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setRecommended([...recommended, ''])}
                    className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-900"
                  >
                    <Plus className="h-3 w-3" /> Thêm gợi ý biển hiệu
                  </button>
                </div>
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

              <div className="mt-4">
                <AIBriefPanel value={aiBrief} onChange={setAiBrief} />
              </div>
              <div className="mt-4">
                <NonBlogSeoTemplatePanel
                  slug={slug}
                  onPromptChange={setSeoPromptTemplate}
                  onApplyToBrief={(payload) => setAiBrief((prev) => ({ ...prev, ...payload }))}
                />
              </div>
            </CardContent>
          </Card>

          <ContentQualityCard
            payload={{
              title,
              description,
              content,
              metaTitle,
              metaDescription,
              contentType: 'industry',
              entityId: isNew ? undefined : id,
              entityTable: 'industries'
            }}
            autoFixPayload={{
              title,
              description,
              content,
              metaTitle,
              metaDescription,
              contentType: 'industry',
              aiBrief,
              entityId: isNew ? undefined : id,
              entityTable: 'industries'
            }}
            onAutoFixApply={(next) => {
              if (next.title) setTitle(next.title);
              if (next.description) setDescription(next.description);
              if (next.content) setContent(next.content);
              if (next.meta_title) setMetaTitle(next.meta_title);
              if (next.meta_description) setMetaDescription(next.meta_description);
            }}
            autoAnalyzeSignal={qaSignal}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Meta title</label>
                <input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                  placeholder="50-60 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Meta description</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm h-20"
                  placeholder="140-155 characters"
                />
              </div>
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
