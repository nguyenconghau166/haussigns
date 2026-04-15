'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, ArrowLeft, Loader2, Image as ImageIcon, Wand2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import RichEditor from '@/components/RichEditor';
import ImagePicker from '@/components/admin/ImagePicker';
import { defaultAIBrief } from '@/components/admin/AIBriefPanel';
import ContentQualityCard from '@/components/admin/ContentQualityCard';
import NonBlogSeoTemplatePanel from '@/components/admin/NonBlogSeoTemplatePanel';

export default function EditMaterial({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const isNew = id === 'create' || id === 'new';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [image, setImage] = useState('');
  const [bestFor, setBestFor] = useState('');
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);

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

    fetch(`/api/admin/materials/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.material) {
          const m = data.material;
          setName(m.name);
          setSlug(m.slug);
          setDescription(m.description || '');
          setContent(m.content || '');
          setMetaTitle(m.meta_title || '');
          setMetaDescription(m.meta_description || '');
          setImage(m.image || '');
          setBestFor(m.best_for || '');
          setPros(Array.isArray(m.pros) ? m.pros : []);
          setCons(Array.isArray(m.cons) ? m.cons : []);
          setAiTopic(m.name);
        }
      })
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const handleSave = async () => {
    if (!name.trim()) {
      toastError('Tên vật liệu là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        slug: slug || slugify(name),
        description,
        content,
        meta_title: metaTitle,
        meta_description: metaDescription,
        image,
        best_for: bestFor,
        pros,
        cons
      };

      // Check for duplicate slug on new materials
      if (isNew) {
        const checkRes = await fetch('/api/admin/materials');
        const checkData = await checkRes.json();
        const existing = (checkData.materials || []).find((m: any) => m.slug === payload.slug);
        if (existing) {
          toastError(`Slug "${payload.slug}" đã tồn tại. Vui lòng đổi tên.`);
          setSaving(false);
          return;
        }
      }

      const res = await fetch(isNew ? '/api/admin/materials' : `/api/admin/materials/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || 'Lỗi khi lưu!');
        return;
      }
      setDirty(false);
      toastSuccess(isNew ? 'Tạo mới thành công!' : 'Lưu thành công!');
      if (isNew) {
        router.push('/admin/materials');
      } else {
        router.refresh();
      }
    } catch (error) {
      toastError('Lỗi khi lưu!');
    } finally {
      setSaving(false);
    }
  };

  const handleListChange = (setter: any, list: string[], index: number, value: string) => {
    const newList = [...list];
    newList[index] = value;
    setter(newList);
  };

  const addListItem = (setter: any, list: string[]) => setter([...list, '']);
  const removeListItem = (setter: any, list: string[], index: number) => {
    setter(list.filter((_, i) => i !== index));
  };

  const handleGenerateContent = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `Detailed guide about ${aiTopic || name} for signage`,
          lang: 'en',
          tone: 'educational',
          contentType: 'material',
          aiBrief,
          seoPromptTemplate
        })
      });
      const data = await res.json();
      if (data.title) setName(data.title);
      if (data.description) setDescription(data.description);
      if (data.content) setContent(data.content);
      if (data.meta_title) setMetaTitle(data.meta_title);
      if (data.meta_description) setMetaDescription(data.meta_description);
      if (Array.isArray(data.pros) && data.pros.length > 0) setPros(data.pros);
      if (Array.isArray(data.cons) && data.cons.length > 0) setCons(data.cons);
      if (data.content || data.description || data.title) {
        setQaSignal((prev) => prev + 1);
      }
    } catch (e) {
      toastError('AI Error');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/materials" className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{isNew ? 'Tạo vật liệu mới' : `Chỉnh sửa: ${name}`}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isNew ? 'Tạo vật liệu' : 'Lưu thay đổi'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên vật liệu</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                  <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ứng dụng tốt nhất (Best For)</label>
                <input value={bestFor} onChange={(e) => setBestFor(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="e.g. Indoor logos, Retail stores" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-green-600 mb-2">Ưu điểm (Pros)</label>
                  {pros.map((p, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input value={p} onChange={(e) => handleListChange(setPros, pros, i, e.target.value)} className="flex-1 p-1.5 border rounded text-sm" />
                      <button onClick={() => removeListItem(setPros, pros, i)} className="text-red-400"><Minus className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => addListItem(setPros, pros)} className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-900"><Plus className="h-3 w-3" /> Thêm ưu điểm</button>
                </div>
                <div>
                  <label className="block text-sm font-bold text-red-500 mb-2">Nhược điểm (Cons)</label>
                  {cons.map((c, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input value={c} onChange={(e) => handleListChange(setCons, cons, i, e.target.value)} className="flex-1 p-1.5 border rounded text-sm" />
                      <button onClick={() => removeListItem(setCons, cons, i)} className="text-red-400"><Minus className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => addListItem(setCons, cons)} className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-900"><Plus className="h-3 w-3" /> Thêm nhược điểm</button>
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
                <NonBlogSeoTemplatePanel
                  slug={slug}
                  onPromptChange={setSeoPromptTemplate}
                  onBriefChange={(brief, seoPrompt) => { setAiBrief(brief); setSeoPromptTemplate(seoPrompt); }}
                />
              </div>
            </CardContent>
          </Card>

          <ContentQualityCard
            payload={{
              title: name,
              description,
              content,
              metaTitle,
              metaDescription,
              contentType: 'material',
              entityId: isNew ? undefined : id,
              entityTable: 'materials'
            }}
            autoFixPayload={{
              title: name,
              description,
              content,
              metaTitle,
              metaDescription,
              contentType: 'material',
              aiBrief,
              entityId: isNew ? undefined : id,
              entityTable: 'materials'
            }}
            onAutoFixApply={(next) => {
              if (next.title) setName(next.title);
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
                <ImagePicker
                  label="Ảnh vật liệu (Material Image)"
                  value={image}
                  onChange={setImage}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
