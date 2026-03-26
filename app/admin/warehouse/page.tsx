'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Warehouse, Plus, FileText, Package, TrendingUp,
  ArrowRight, Loader2, Calendar, Trash2, Eye, Search,
  AlertTriangle, Boxes
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ImportReceipt {
  id: string;
  receipt_code: string;
  receipt_date: string;
  supplier: string;
  total_amount: number;
  note: string;
  status: string;
  created_at: string;
}

interface Material {
  id: string;
  name: string;
  sku: string;
  unit: string;
  category: string;
  stock_quantity: number;
  min_stock: number;
}

export default function WarehouseDashboard() {
  const [receipts, setReceipts] = useState<ImportReceipt[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'receipts' | 'materials'>('receipts');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [receiptsRes, materialsRes] = await Promise.all([
        fetch('/api/admin/warehouse/import-receipts'),
        fetch('/api/admin/warehouse/materials'),
      ]);
      const receiptsData = await receiptsRes.json();
      const materialsData = await materialsRes.json();
      setReceipts(receiptsData.receipts || []);
      setMaterials(materialsData.materials || []);
    } catch (error) {
      console.error('Failed to load warehouse data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    if (!confirm('Xóa phiếu nhập sẽ hoàn trả tồn kho. Bạn có chắc?')) return;
    try {
      await fetch(`/api/admin/warehouse/import-receipts/${id}`, { method: 'DELETE' });
      setReceipts(prev => prev.filter(r => r.id !== id));
      // Reload materials to get updated stock
      const materialsRes = await fetch('/api/admin/warehouse/materials');
      const materialsData = await materialsRes.json();
      setMaterials(materialsData.materials || []);
    } catch (error) {
      console.error(error);
      alert('Xóa thất bại');
    }
  };

  const totalStockValue = materials.reduce((sum, m) => sum + (m.stock_quantity || 0), 0);
  const totalReceiptValue = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const lowStockMaterials = materials.filter(m => m.min_stock > 0 && m.stock_quantity <= m.min_stock);

  const filteredReceipts = receipts.filter(r =>
    r.receipt_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.supplier || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Đang tải dữ liệu kho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Warehouse className="h-5 w-5 text-white" />
            </div>
            Quản lý Kho
          </h1>
          <p className="text-slate-500 mt-1">Tổng quan tồn kho và phiếu nhập hàng</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/warehouse/materials"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Package className="h-4 w-4" />
            Vật tư
          </Link>
          <Link
            href="/admin/warehouse/import/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Tạo phiếu nhập
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Tổng vật tư</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{materials.length}</p>
                <p className="text-xs text-slate-400 mt-2">{materials.filter(m => m.stock_quantity > 0).length} có tồn kho</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div className="h-1 w-full rounded-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 opacity-20 group-hover:opacity-100 transition-opacity" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Phiếu nhập</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{receipts.length}</p>
                <p className="text-xs text-slate-400 mt-2">phiếu đã tạo</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="h-1 w-full rounded-full mt-4 bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-20 group-hover:opacity-100 transition-opacity" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Giá trị nhập kho</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalReceiptValue)}</p>
                <p className="text-xs text-slate-400 mt-2">tổng cộng</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="h-1 w-full rounded-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 opacity-20 group-hover:opacity-100 transition-opacity" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Sắp hết hàng</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{lowStockMaterials.length}</p>
                <p className="text-xs text-red-400 mt-2">{lowStockMaterials.length > 0 ? 'Cần nhập thêm!' : 'Tồn kho ổn'}</p>
              </div>
              <div className={cn("p-3 rounded-xl", lowStockMaterials.length > 0 ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-400")}>
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className={cn("h-1 w-full rounded-full mt-4 bg-gradient-to-r opacity-20 group-hover:opacity-100 transition-opacity", lowStockMaterials.length > 0 ? "from-red-500 to-red-600" : "from-slate-300 to-slate-400")} />
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => { setActiveTab('receipts'); setSearchTerm(''); }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'receipts' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Phiếu nhập ({receipts.length})
          </button>
          <button
            onClick={() => { setActiveTab('materials'); setSearchTerm(''); }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'materials' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Boxes className="h-4 w-4 inline mr-2" />
            Tồn kho ({materials.length})
          </button>
        </div>
        <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 w-full sm:w-80">
          <div className="relative">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder={activeTab === 'receipts' ? 'Tìm mã phiếu, nhà cung cấp...' : 'Tìm vật tư, SKU...'}
              className="pl-6 w-full outline-none text-sm bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Receipts Tab */}
      {activeTab === 'receipts' && (
        <Card className="border-0 shadow-md overflow-hidden">
          <CardContent className="p-0">
            {filteredReceipts.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Chưa có phiếu nhập nào</p>
                <p className="text-xs text-slate-400 mt-1">Tạo phiếu nhập đầu tiên để bắt đầu quản lý kho</p>
                <Link
                  href="/admin/warehouse/import/new"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Tạo phiếu nhập
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mã phiếu</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày nhập</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhà cung cấp</th>
                      <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng tiền</th>
                      <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReceipts.map((receipt) => (
                      <tr key={receipt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-emerald-600">{receipt.receipt_code}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(receipt.receipt_date).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-700">{receipt.supplier || '—'}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-slate-900">{formatCurrency(receipt.total_amount)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            'inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase',
                            receipt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                            receipt.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          )}>
                            {receipt.status === 'confirmed' ? 'Đã xác nhận' : receipt.status === 'draft' ? 'Nháp' : 'Đã hủy'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              href={`/admin/warehouse/import/${receipt.id}`}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteReceipt(receipt.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <Card className="border-0 shadow-md overflow-hidden">
          <CardContent className="p-0">
            {filteredMaterials.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Chưa có vật tư nào</p>
                <p className="text-xs text-slate-400 mt-1">Chạy migration để khởi tạo danh mục vật tư mặc định</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vật tư</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhóm</th>
                      <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Đơn vị</th>
                      <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tồn kho</th>
                      <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tồn tối thiểu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMaterials.map((mat) => (
                      <tr key={mat.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-900">{mat.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{mat.sku || '—'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">{mat.category || '—'}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-slate-500">{mat.unit}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn(
                            'text-sm font-semibold',
                            mat.min_stock > 0 && mat.stock_quantity <= mat.min_stock ? 'text-red-600' : 'text-slate-900'
                          )}>
                            {mat.stock_quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-slate-400">{mat.min_stock}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
