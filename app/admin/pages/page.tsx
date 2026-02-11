'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Edit, Eye, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';

interface Page {
  id: string;
  title: string;
  slug: string;
  updated_at: string;
  is_published: boolean;
}

export default function PagesAdmin() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch from API. 
    // Since we don't have a direct 'list pages' API yet, we might need one.
    // However, for this task, I'll create a simple client-side fetcher if I can, 
    // or better, I'll create a server action or API route.
    // Let's create the API route first.
    fetch('/api/admin/pages')
      .then(res => res.json())
      .then(data => {
        if (data.pages) setPages(data.pages);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý Trang</h1>
          <p className="text-slate-500 mt-1">Chỉnh sửa nội dung các trang con (About, Services, Portfolio...)</p>
        </div>
        {/* We can add 'Create Page' later if needed, but for now we manage existing ones */}
        {/* <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="h-4 w-4" /> Thêm trang mới
        </button> */}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <Card key={page.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="truncate">{page.title}</span>
                <Link href={`/${page.slug}`} target="_blank" className="text-slate-400 hover:text-amber-500">
                  <Eye className="h-4 w-4" />
                </Link>
              </CardTitle>
              <CardDescription className="text-xs font-mono bg-slate-100 w-fit px-2 py-0.5 rounded">
                /{page.slug}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${page.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {page.is_published ? 'Published' : 'Draft'}
                </span>
                <Link
                  href={`/admin/pages/${page.slug}`}
                  className="flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700"
                >
                  <Edit className="h-4 w-4" /> Chỉnh sửa
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Fallback if no pages found (e.g. before migration runs) */}
        {pages.length === 0 && (
          <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">Chưa có trang nào. Vui lòng chạy Migration hoặc kiểm tra kết nối Database.</p>
            <button 
                onClick={() => fetch('/api/admin/migrate').then(() => window.location.reload())}
                className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm"
            >
                Khởi tạo dữ liệu mẫu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
