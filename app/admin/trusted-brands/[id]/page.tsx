'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import ImagePicker from '@/components/admin/ImagePicker';

export default function EditTrustedBrand({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const isNew = id === 'create' || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/trusted-brands/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.brand) {
          const b = data.brand;
          setName(b.name || '');
          setLogoUrl(b.logo_url || '');
          setWebsiteUrl(b.website_url || '');
          setDisplayOrder(b.display_order ?? 0);
          setIsActive(b.is_active !== false);
        }
      })
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const handleSave = async () => {
    if (!name.trim()) {
      toastError('Tên thương hiệu là bắt buộc');
      return;
    }
    if (!logoUrl.trim()) {
      toastError('Logo là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        logo_url: logoUrl,
        website_url: websiteUrl || null,
        display_order: displayOrder,
        is_active: isActive,
      };
      const res = await fetch(isNew ? '/api/admin/trusted-brands' : `/api/admin/trusted-brands/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || 'Lỗi khi lưu');
        return;
      }
      toastSuccess(isNew ? 'Đã tạo thương hiệu' : 'Đã lưu thay đổi');
      if (isNew) router.push('/admin/trusted-brands');
      else router.refresh();
    } catch {
      toastError('Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/trusted-brands" className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {isNew ? 'Thêm thương hiệu' : `Chỉnh sửa: ${name}`}
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isNew ? 'Tạo' : 'Lưu thay đổi'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Thông tin thương hiệu</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên thương hiệu</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g. Vuori, Café Kitsuné"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Website (tuỳ chọn)</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
                    className="w-full p-2 border rounded-lg"
                  />
                  <p className="text-xs text-slate-500 mt-1">Số nhỏ hiển thị trước.</p>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    Hiển thị trên homepage
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Logo</CardTitle></CardHeader>
            <CardContent>
              <ImagePicker
                label="Logo thương hiệu (PNG nền trong suốt)"
                value={logoUrl}
                onChange={setLogoUrl}
              />
              <p className="text-xs text-slate-500 mt-3">
                Nên dùng PNG/SVG nền trong suốt, cao ~80px. Logo sẽ được render grayscale với amber hover.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
