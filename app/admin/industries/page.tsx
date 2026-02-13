'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash, Eye, Loader2, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function IndustriesAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/industries')
      .then(res => res.json())
      .then(data => setItems(data.industries || []))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa ngành hàng này?')) return;
    await fetch('/api/admin/industries', {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý Ngành hàng (Industries)</h1>
          <p className="text-slate-500 mt-1">Danh sách các lĩnh vực kinh doanh phục vụ</p>
        </div>
        <Link
          href="/admin/industries/create"
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> Thêm mới
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-slate-100 rounded-lg">
                  {/* Simple icon fallback */}
                  <Building2 className="h-5 w-5 text-slate-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/services/industries/${item.slug}`} target="_blank" className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-500">
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded text-slate-400 hover:text-red-500">
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <CardTitle className="mt-3">{item.title}</CardTitle>
              <CardDescription className="line-clamp-2">{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Link
                  href={`/admin/industries/${item.id}`}
                  className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700"
                >
                  <Edit className="h-4 w-4" /> Chỉnh sửa
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Xóa"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">Chưa có dữ liệu. Hãy chạy migration v9 để khởi tạo dữ liệu mẫu.</p>
            <button
              onClick={() => fetch('/api/admin/migrate-v9').then(() => window.location.reload())}
              className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm"
            >
              Khởi tạo dữ liệu mẫu (v9)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
