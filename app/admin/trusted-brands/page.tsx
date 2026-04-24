'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash, Loader2, Building2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Brand {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string | null;
  display_order: number;
  is_active: boolean;
}

export default function TrustedBrandsAdmin() {
  const [items, setItems] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/trusted-brands')
      .then(res => res.json())
      .then(data => setItems(data.brands || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Xoá thương hiệu này khỏi danh sách?')) return;
    await fetch('/api/admin/trusted-brands', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const toggleActive = async (brand: Brand) => {
    await fetch(`/api/admin/trusted-brands/${brand.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !brand.is_active }),
    });
    setItems(prev => prev.map(b => b.id === brand.id ? { ...b, is_active: !b.is_active } : b));
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trusted Brands</h1>
          <p className="text-slate-500 mt-1">Logo khách hàng hiển thị ở dải &quot;Trusted By&quot; trên homepage.</p>
        </div>
        <Link
          href="/admin/trusted-brands/create"
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> Thêm thương hiệu
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-slate-900 rounded-lg w-24 h-16 flex items-center justify-center">
                  {item.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.logo_url} alt={item.name} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Building2 className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <button
                  onClick={() => toggleActive(item)}
                  className={`p-2 rounded text-slate-400 hover:bg-slate-100 ${item.is_active ? 'text-emerald-600' : 'text-slate-400'}`}
                  title={item.is_active ? 'Đang hiển thị — ẩn' : 'Đang ẩn — hiện'}
                >
                  {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              <CardTitle className="mt-3">{item.name}</CardTitle>
              <CardDescription>
                Thứ tự: {item.display_order} · {item.is_active ? 'Đang hiển thị' : 'Đang ẩn'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Link
                  href={`/admin/trusted-brands/${item.id}`}
                  className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700"
                >
                  <Edit className="h-4 w-4" /> Chỉnh sửa
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Xoá"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">Chưa có thương hiệu nào. Thêm logo khách hàng đầu tiên để hiển thị ở homepage.</p>
          </div>
        )}
      </div>
    </div>
  );
}
