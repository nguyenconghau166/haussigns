'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Edit, Eye, Loader2, Plus, AlertTriangle, CheckCircle, Copy } from 'lucide-react';
import Link from 'next/link';

interface Page {
  id: string;
  title: string;
  slug: string;
  updated_at: string;
  is_published: boolean;
}

const SCHEMA_SQL = `
-- Run this in your Supabase SQL Editor to create the necessary tables
CREATE TABLE IF NOT EXISTS site_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  featured_image TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_pages (slug, title, content, is_published)
VALUES 
('about', 'About Us', 'Welcome to SignsHaus...', true),
('services', 'Our Services', 'We offer a wide range of signage services...', true),
('portfolio', 'Our Portfolio', 'Check out our latest works...', true),
('contact', 'Contact Us', 'Get in touch with us...', true)
ON CONFLICT (slug) DO NOTHING;
`;

export default function PagesAdmin() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [migrationError, setMigrationError] = useState('');

  const fetchPages = () => {
    setLoading(true);
    fetch('/api/admin/pages')
      .then(res => res.json())
      .then(data => {
        if (data.pages) setPages(data.pages);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Initial fetch
    fetchPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMigrate = async () => {
    setMigrationStatus('running');
    setMigrationError('');
    try {
      const res = await fetch('/api/admin/migrate');
      const data = await res.json();
      if (data.success) {
        setMigrationStatus('success');
        fetchPages(); // Reload pages
      } else {
        setMigrationStatus('error');
        setMigrationError(data.error || 'Unknown error');
      }
    } catch (err) {
      setMigrationStatus('error');
      setMigrationError('Network error');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    alert('SQL copied to clipboard!');
  };

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

        {/* Fallback if no pages found */}
        {pages.length === 0 && (
          <div className="col-span-full space-y-6">
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
              <p className="text-slate-900 font-medium text-lg">Chưa tìm thấy dữ liệu trang</p>
              <p className="text-slate-500 mt-1 mb-6 max-w-md mx-auto">
                Cơ sở dữ liệu chưa có bảng `site_pages`. Bạn cần chạy migration để khởi tạo.
              </p>
              
              <div className="flex flex-col items-center gap-4">
                <button 
                    onClick={handleMigrate}
                    disabled={migrationStatus === 'running'}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20"
                >
                    {migrationStatus === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Tự động khởi tạo dữ liệu
                </button>
                
                {migrationStatus === 'success' && (
                  <p className="text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg">
                    <CheckCircle className="h-4 w-4" /> Khởi tạo thành công! Đang tải lại...
                  </p>
                )}
              </div>
            </div>

            {/* Manual SQL Fallback */}
            {(migrationStatus === 'error' || migrationStatus === 'idle') && (
               <Card className="border-red-100 shadow-none">
                 <CardHeader>
                   <CardTitle className="text-red-600 flex items-center gap-2 text-base">
                     <AlertTriangle className="h-5 w-5" /> 
                     {migrationStatus === 'error' ? 'Tự động khởi tạo thất bại' : 'Cách thủ công (Nếu nút trên không hoạt động)'}
                   </CardTitle>
                   <CardDescription>
                     {migrationStatus === 'error' 
                        ? `Lỗi: ${migrationError}. Có thể do thiếu quyền Admin Database (RPC exec_sql).` 
                        : 'Nếu ứng dụng không có quyền chạy lệnh SQL (RPC), hãy copy đoạn code dưới đây:'}
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="relative">
                     <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed">
                       {SCHEMA_SQL}
                     </pre>
                     <button 
                       onClick={copyToClipboard}
                       className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                       title="Copy SQL"
                     >
                       <Copy className="h-4 w-4" />
                     </button>
                   </div>
                   <p className="text-sm text-slate-500 mt-4">
                     👉 Vào <a href="https://supabase.com/dashboard" target="_blank" className="text-indigo-600 hover:underline">Supabase Dashboard</a> {'>'} SQL Editor {'>'} Paste đoạn code trên và nhấn Run.
                   </p>
                 </CardContent>
               </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
