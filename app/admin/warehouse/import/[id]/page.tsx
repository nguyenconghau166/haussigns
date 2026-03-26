'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Calendar, Building2, FileText,
  Package, Hash, Printer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ReceiptDetail {
  id: string;
  receipt_code: string;
  receipt_date: string;
  supplier: string;
  total_amount: number;
  note: string;
  status: string;
  created_at: string;
}

interface ReceiptItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  note: string;
  warehouse_materials: {
    name: string;
    sku: string;
    unit: string;
    category: string;
  };
}

export default function ImportReceiptDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipt();
  }, [id]);

  const loadReceipt = async () => {
    try {
      const res = await fetch(`/api/admin/warehouse/import-receipts/${id}`);
      const data = await res.json();
      setReceipt(data.receipt);
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to load receipt:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!receipt) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Không tìm thấy phiếu nhập</p>
        <Link href="/admin/warehouse" className="text-emerald-600 hover:underline text-sm mt-2 inline-block">
          ← Quay lại
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
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
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Hash className="h-5 w-5 text-emerald-500" />
              {receipt.receipt_code}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Chi tiết phiếu nhập hàng</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className={cn(
            'inline-flex px-3 py-1.5 rounded-full text-xs font-semibold uppercase',
            receipt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
            receipt.status === 'draft' ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          )}>
            {receipt.status === 'confirmed' ? 'Đã xác nhận' : receipt.status === 'draft' ? 'Nháp' : 'Đã hủy'}
          </span>
        </div>
      </div>

      {/* Receipt Info */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Ngày nhập</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">
                  {new Date(receipt.receipt_date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-purple-50">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Nhà cung cấp</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{receipt.supplier || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50">
                <Package className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Số lượng vật tư</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{items.length} mục</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50">
                <FileText className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Tổng tiền</p>
                <p className="text-lg font-bold text-emerald-600 mt-0.5">{formatCurrency(receipt.total_amount)}</p>
              </div>
            </div>
          </div>
          {receipt.note && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Ghi chú</p>
              <p className="text-sm text-slate-600">{receipt.note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-slate-700">
            <Package className="h-4 w-4 text-emerald-500" />
            Danh sách vật tư đã nhập
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vật tư</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhóm</th>
                  <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">ĐVT</th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Số lượng</th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Đơn giá</th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-400 font-bold">{index + 1}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">{item.warehouse_materials?.name || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {item.warehouse_materials?.sku || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{item.warehouse_materials?.category || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-slate-500">{item.warehouse_materials?.unit || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-slate-900">{item.quantity}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-slate-600">{formatCurrency(item.unit_price)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-emerald-600">{formatCurrency(item.total_price)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50/50 border-t-2 border-emerald-200">
                  <td colSpan={5} className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-slate-700 uppercase">Tổng cộng</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-slate-700">
                      {items.reduce((sum, i) => sum + i.quantity, 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(receipt.total_amount)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 pb-6">
        <span>Tạo lúc: {new Date(receipt.created_at).toLocaleString('vi-VN')}</span>
        <Link href="/admin/warehouse" className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
          ← Quay lại danh sách
        </Link>
      </div>
    </div>
  );
}
