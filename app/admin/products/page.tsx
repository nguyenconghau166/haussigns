'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash, Eye, Loader2, Package, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    cover_image: string;
    is_published: boolean;
}

export default function ProductsAdmin() {
    const [items, setItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/admin/products');
            const data = await res.json();
            setItems(data.products || []);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
        try {
            await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            console.error(error);
            alert("Failed to delete");
        }
    }

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Quản lý Sản phẩm (Products)</h1>
                    <p className="text-slate-500 mt-1">Danh sách các sản phẩm và dịch vụ cung cấp</p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
                >
                    <Plus className="h-4 w-4" /> Thêm mới
                </Link>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 w-full md:w-1/2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        placeholder="Tìm kiếm sản phẩm..."
                        className="pl-10 w-full outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                    <Card key={item.id} className="group hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 relative">
                            <div className="aspect-video w-full relative rounded-lg overflow-hidden bg-slate-100 mb-4">
                                {item.cover_image ? (
                                    <Image src={item.cover_image} alt={item.name} fill className="object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-300">
                                        <Package className="h-10 w-10" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link href={`/products/${item.slug}`} target="_blank" className="p-2 bg-white/90 hover:bg-white rounded text-slate-600 hover:text-amber-500 shadow-sm">
                                        <Eye className="h-4 w-4" />
                                    </Link>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 bg-white/90 hover:bg-white rounded text-slate-600 hover:text-red-500 shadow-sm">
                                        <Trash className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <CardTitle className="mt-1">{item.name}</CardTitle>
                            <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Link
                                    href={`/admin/products/${item.id}`}
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
                        <p className="text-slate-500">Chưa có dữ liệu. Hãy tạo sản phẩm đầu tiên.</p>
                        <button
                            onClick={() => fetch('/api/admin/migrate-v16').then(() => window.location.reload())}
                            className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm"
                        >
                            Khởi tạo dữ liệu (nếu cần)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
