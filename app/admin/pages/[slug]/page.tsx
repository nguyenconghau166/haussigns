'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Eye, Loader2, ArrowLeft, Wand2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

import RichEditor from '@/components/RichEditor';
import ImageUploader from '@/components/ImageUploader';

export default function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
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

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLang, setAiLang] = useState('en');
  const [aiTone, setAiTone] = useState('professional');
  const [aiImagePrompt, setAiImagePrompt] = useState('');

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
          
          // Pre-fill AI topic if empty
          setAiTopic(data.page.title);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleGenerateContent = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic || title, lang: aiLang, tone: aiTone }),
      });
      const data = await res.json();
      if (data.content) {
        setContent(data.content);
        // Suggest image prompt
        setAiImagePrompt(`Professional photo of ${aiTopic || title}, modern style, high quality, 8k`);
      }
    } catch (err) {
      console.error(err);
      alert('AI Generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!aiImagePrompt) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiImagePrompt }),
      });
      const data = await res.json();
      if (data.url) {
        setFeaturedImage(data.url);
      }
    } catch (err) {
      console.error(err);
      alert('Image Generation failed');
    } finally {
      setAiLoading(false);
    }
  };

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
                <label className="block text-sm font-medium mb-1">Nội dung chính</label>
                <RichEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Nhập nội dung trang tại đây..."
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <Card className="border-amber-100 shadow-amber-500/10 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-amber-600" />
                AI Content Tools
              </CardTitle>
              <CardDescription>Tạo nội dung tự động</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Chủ đề / Từ khóa</label>
                <input 
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder={title}
                  className="w-full mt-1 p-2 text-sm border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                   <label className="text-xs font-medium text-slate-500">Ngôn ngữ</label>
                   <select 
                      value={aiLang}
                      onChange={(e) => setAiLang(e.target.value)}
                      className="w-full mt-1 p-2 text-sm border rounded-lg"
                   >
                      <option value="en">English</option>
                      <option value="tl">Vietnamese</option>
                      <option value="mix">Song ngữ</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs font-medium text-slate-500">Giọng văn</label>
                   <select 
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="w-full mt-1 p-2 text-sm border rounded-lg"
                   >
                      <option value="professional">Chuyên nghiệp</option>
                      <option value="friendly">Thân thiện</option>
                      <option value="persuasive">Bán hàng</option>
                   </select>
                </div>
              </div>
              <button 
                onClick={handleGenerateContent}
                disabled={aiLoading}
                className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Viết nội dung (Draft)
              </button>
              
              <hr className="border-slate-100 my-2" />
              
              <div>
                <label className="text-xs font-medium text-slate-500">Prompt tạo ảnh</label>
                <textarea 
                  value={aiImagePrompt}
                  onChange={(e) => setAiImagePrompt(e.target.value)}
                  placeholder="Mô tả hình ảnh muốn tạo..."
                  className="w-full mt-1 p-2 text-xs border rounded-lg h-16"
                />
              </div>
              <button 
                onClick={handleGenerateImage}
                disabled={aiLoading || !aiImagePrompt}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                Tạo ảnh minh họa
              </button>
            </CardContent>
          </Card>

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
                <ImageUploader 
                    label="Hình ảnh đại diện (OG Image)"
                    value={featuredImage}
                    onChange={setFeaturedImage}
                    aspectRatio={16/9}
                />
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
