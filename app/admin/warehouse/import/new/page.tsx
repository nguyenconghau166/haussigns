'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Save, Loader2, Package,
  CalendarDays, Building2, FileText, Calculator
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Material {
  id: string;
  name: string;
  sku: string;
  unit: string;
  category: string;
  unit_price: number;
}

interface ReceiptItem {
  material_id: string;
  quantity: number;
  unit_price: number;
  note: string;
}

export default function CreateImportReceipt() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Receipt header
  const [supplier, setSupplier] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  // Receipt items
  const [items, setItems] = useState<ReceiptItem[]>([
    { material_id: '', quantity: 0, unit_price: 0, note: '' },
  ]);

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

  const addItem = () => {
    setItems(prev => [...prev, { material_id: '', quantity: 0, unit_price: 0, note: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-fill unit price from material master data when material selected
      if (field === 'material_id') {
        const mat = materials.find(m => m.id === value);
        if (mat && mat.unit_price > 0 && updated[index].unit_price === 0) {
          updated[index].unit_price = mat.unit_price;
        }
      }
      return updated;
    });
  };

  const getMaterialInfo = (materialId: string) => {
    return materials.find(m => m.id === materialId);
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const validItems = items.filter(item => item.material_id && item.quantity > 0 && item.unit_price > 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleSave = async () => {
    if (validItems.length === 0) {
      alert('Vui lòng thêm ít nhất 1 vật tư hợp lệ (có chọn vật tư, số lượng và đơn giá > 0)');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/warehouse/import-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier,
          receipt_date: receiptDate,
          note,
          items: validItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Lưu thất bại');
        return;
      }

      router.push('/admin/warehouse');
    } catch (error) {
      console.error(error);
      alert('Lỗi khi lưu phiếu nhập');
    } finally {
      setSaving(false);
    }
  };

  // Group materials by category for easier selection
  const materialsByCategory = materials.reduce<Record<string, Material[]>>((acc, mat) => {
    const cat = mat.category || 'Khác';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(mat);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/warehouse"
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tạo phiếu nhập hàng</h1>
          <p className="text-slate-500 text-sm mt-0.5">Nhập nhiều vật tư cùng lúc</p>
        </div>
      </div>

      {/* Receipt Header Info */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-slate-700">
            <FileText className="h-4 w-4 text-emerald-500" />
            Thông tin phiếu nhập
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                <CalendarDays className="h-3 w-3 inline mr-1" />
                Ngày nhập
              </label>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                <Building2 className="h-3 w-3 inline mr-1" />
                Nhà cung cấp
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="VD: Công ty ABC, Cửa hàng XYZ..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Ghi chú
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú thêm..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-slate-700">
            <Package className="h-4 w-4 text-emerald-500" />
            Danh sách vật tư nhập
          </CardTitle>
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Thêm dòng
          </button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-8">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[250px]">Vật tư</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">ĐVT</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Số lượng</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Đơn giá (₫)</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Thành tiền</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => {
                  const matInfo = getMaterialInfo(item.material_id);
                  const lineTotal = item.quantity * item.unit_price;
                  return (
                    <tr key={index} className="group hover:bg-emerald-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-slate-400">{index + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.material_id}
                          onChange={(e) => updateItem(index, 'material_id', e.target.value)}
                          className={cn(
                            'w-full px-2.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all',
                            item.material_id ? 'border-slate-200 text-slate-900' : 'border-amber-300 text-slate-400 bg-amber-50/50'
                          )}
                        >
                          <option value="">-- Chọn vật tư --</option>
                          {Object.entries(materialsByCategory).map(([cat, mats]) => (
                            <optgroup key={cat} label={`📦 ${cat}`}>
                              {mats.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name} {m.sku ? `(${m.sku})` : ''}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {matInfo?.unit || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.quantity || ''}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={item.unit_price || ''}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          'text-sm font-semibold',
                          lineTotal > 0 ? 'text-slate-900' : 'text-slate-300'
                        )}>
                          {lineTotal > 0 ? formatCurrency(lineTotal) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeItem(index)}
                          disabled={items.length <= 1}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            items.length > 1 ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-200 cursor-not-allowed'
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add more + Total */}
          <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={addItem}
                className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Plus className="h-4 w-4" /> Thêm vật tư
              </button>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Tổng cộng ({validItems.length} vật tư)</span>
                  <p className="text-xl font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                    <Calculator className="h-5 w-5 text-emerald-500" />
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <Link
          href="/admin/warehouse"
          className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-800 font-medium"
        >
          ← Hủy, quay lại
        </Link>
        <button
          onClick={handleSave}
          disabled={saving || validItems.length === 0}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
            validItems.length > 0 && !saving
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/25'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          )}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Lưu phiếu nhập ({validItems.length} vật tư)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
