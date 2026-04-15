'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Loader2, Package, Edit2, Check, X,
  Trash2, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface Material {
  id: string;
  name: string;
  sku: string;
  unit: string;
  category: string;
  stock_quantity: number;
  min_stock: number;
  unit_price: number;
  note: string;
  is_active: boolean;
}

export default function MaterialsManagement() {
  const { error: toastError, warning: toastWarning } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '', sku: '', unit: 'cái', category: '', min_stock: 0, unit_price: 0, note: ''
  });

  const UNITS = ['cái', 'tấm', 'mét', 'm²', 'kg', 'cuộn', 'bộ', 'thanh', 'cây', 'hộp', 'tuýp', 'lít'];
  const CATEGORIES = ['Mica', 'LED', 'Inox', 'Aluminium', 'Sắt/Thép', 'Tôn', 'Điện', 'Phụ kiện', 'Sơn', 'Keo', 'Khác'];

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/admin/warehouse/materials');
      const data = await res.json();
      setMaterials(data.materials || []);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', sku: '', unit: 'cái', category: '', min_stock: 0, unit_price: 0, note: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.unit) {
      toastWarning('Tên và đơn vị tính là bắt buộc');
      return;
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/warehouse/materials/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const data = await res.json();
          setMaterials(prev => prev.map(m => m.id === editingId ? data.material : m));
        }
      } else {
        const res = await fetch('/api/admin/warehouse/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const data = await res.json();
          setMaterials(prev => [data.material, ...prev]);
        }
      }
      resetForm();
    } catch (error) {
      console.error(error);
      toastError('Lưu thất bại');
    }
  };

  const handleEdit = (mat: Material) => {
    setFormData({
      name: mat.name,
      sku: mat.sku || '',
      unit: mat.unit,
      category: mat.category || '',
      min_stock: mat.min_stock,
      unit_price: mat.unit_price,
      note: mat.note || '',
    });
    setEditingId(mat.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Vô hiệu hóa vật tư này?')) return;
    try {
      await fetch(`/api/admin/warehouse/materials/${id}`, { method: 'DELETE' });
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const filtered = materials.filter(m =>
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
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/warehouse"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Danh mục Vật tư</h1>
            <p className="text-slate-500 text-sm mt-0.5">{materials.length} vật tư trong kho</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
        >
          <Plus className="h-4 w-4" /> Thêm vật tư
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="border-2 border-emerald-200 shadow-md bg-emerald-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-emerald-700">
              {editingId ? 'Chỉnh sửa vật tư' : 'Thêm vật tư mới'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Tên vật tư *"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
              />
              <input
                type="text"
                placeholder="Mã SKU (tùy chọn)"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
              />
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
              >
                <option value="">-- Nhóm vật tư --</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="number"
                placeholder="Tồn kho tối thiểu"
                value={formData.min_stock || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, min_stock: parseFloat(e.target.value) || 0 }))}
                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
              />
              <input
                type="number"
                placeholder="Đơn giá tham khảo (₫)"
                value={formData.unit_price || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
              />
            </div>
            <div className="mt-3">
              <input
                type="text"
                placeholder="Ghi chú (kích thước, thông số...)"
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                <Check className="h-3.5 w-3.5" /> {editingId ? 'Cập nhật' : 'Thêm'}
              </button>
              <button
                onClick={resetForm}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Hủy
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 w-full md:w-96">
        <div className="relative">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Tìm vật tư, SKU, nhóm..."
            className="pl-6 w-full outline-none text-sm bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vật tư</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhóm</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ĐVT</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tồn kho</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Giá TK</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ghi chú</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((mat) => (
                  <tr key={mat.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-slate-900">{mat.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{mat.sku || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{mat.category || '—'}</td>
                    <td className="px-5 py-3.5 text-center text-sm text-slate-500">{mat.unit}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={cn(
                        'text-sm font-semibold',
                        mat.min_stock > 0 && mat.stock_quantity <= mat.min_stock ? 'text-red-600' : 'text-slate-900'
                      )}>
                        {mat.stock_quantity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-slate-600">
                      {mat.unit_price > 0 ? formatCurrency(mat.unit_price) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 max-w-[200px] truncate">{mat.note || '—'}</td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(mat)}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(mat.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Không tìm thấy vật tư nào</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
