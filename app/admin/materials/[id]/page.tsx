'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, ArrowLeft, Loader2, Image as ImageIcon, Wand2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import RichEditor from '@/components/RichEditor';
import ImagePicker from '@/components/admin/ImagePicker';

export default function EditMaterial({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [bestFor, setBestFor] = useState('');
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');

  useEffect(() => {
    fetch(`/api/admin/materials/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.material) {
          const m = data.material;
          setName(m.name);
          setSlug(m.slug);
          setDescription(m.description || '');
          setContent(m.content || '');
          setImage(m.image || '');
          setBestFor(m.best_for || '');
          setPros(Array.isArray(m.pros) ? m.pros : []);
          setCons(Array.isArray(m.cons) ? m.cons : []);
          setAiTopic(m.name);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/materials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, slug, description, content, image, best_for: bestFor, pros, cons
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
        body: JSON.stringify({
          topic: `Detailed guide about ${aiTopic || name} for signage`,
          lang: 'en',
          tone: 'educational'
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
          <Link href="/admin/materials" className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Chỉnh sửa: {name}</h1>
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
