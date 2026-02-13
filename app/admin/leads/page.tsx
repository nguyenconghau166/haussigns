'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, Search, Paperclip } from 'lucide-react';
import { format } from 'date-fns';

export default function LeadsAdmin() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statuses, setStatuses] = useState<string[]>(['New', 'Contacted', 'Quoted', 'Closed']);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/contact').then(res => res.json()),
            fetch('/api/admin/settings').then(res => res.json())
        ]).then(([leadsData, settingsData]) => {
            if (leadsData.leads) setLeads(leadsData.leads);
            if (settingsData.settings?.lead_statuses) {
                const customStatuses = settingsData.settings.lead_statuses.split(',').map((s: string) => s.trim()).filter(Boolean);
                if (customStatuses.length > 0) setStatuses(customStatuses);
            }
        }).finally(() => setLoading(false));
    }, []);

    const handleStatusChange = async (id: string, newStatus: string) => {
        setUpdating(id);
        try {
            const res = await fetch('/api/contact', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });
            if (res.ok) {
                setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
            } else {
                alert('Failed to update status');
            }
        } catch (e) {
            console.error(e);
            alert('Error updating status');
        } finally {
            setUpdating(null);
        }
    };

    const filteredLeads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Quản lý Khách hàng (Leads)</h1>
                    <p className="text-slate-500 mt-1">Danh sách yêu cầu báo giá và liên hệ từ website</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        className="pl-10 pr-4 py-2 border rounded-xl text-sm w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Excel-like Table View */}
            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto max-h-[calc(100vh-220px)]">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-3 py-2 border-b w-[100px]">Ngày</th>
                                <th className="px-3 py-2 border-b w-[180px]">Khách hàng</th>
                                <th className="px-3 py-2 border-b w-[200px]">Liên hệ</th>
                                <th className="px-3 py-2 border-b w-[100px]">Loại</th>
                                <th className="px-3 py-2 border-b min-w-[300px]">Nội dung</th>
                                <th className="px-3 py-2 border-b w-[80px] text-center">File</th>
                                <th className="px-3 py-2 border-b w-[140px]">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLeads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-3 py-1.5 whitespace-nowrap text-slate-500 text-xs border-r border-slate-100">
                                        {format(new Date(lead.created_at), 'dd/MM/yy HH:mm')}
                                    </td>

                                    <td className="px-3 py-1.5 font-medium text-slate-900 border-r border-slate-100">
                                        <div className="truncate max-w-[180px]" title={lead.name}>{lead.name}</div>
                                    </td>

                                    <td className="px-3 py-1.5 text-slate-600 border-r border-slate-100">
                                        <div className="space-y-0.5">
                                            {lead.phone && (
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <Phone className="h-3 w-3 text-slate-400" />
                                                    <span className="font-mono">{lead.phone}</span>
                                                </div>
                                            )}
                                            {lead.email && (
                                                <div className="flex items-center gap-1.5 text-xs truncate max-w-[190px]" title={lead.email}>
                                                    <Mail className="h-3 w-3 text-slate-400" />
                                                    <span>{lead.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-3 py-1.5 border-r border-slate-100">
                                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] uppercase font-bold rounded border border-slate-200 whitespace-nowrap">
                                            {lead.type || 'General'}
                                        </span>
                                    </td>

                                    <td className="px-3 py-1.5 text-slate-600 border-r border-slate-100 max-w-[300px]">
                                        <div
                                            className="truncate text-xs cursor-help group-hover:text-slate-900"
                                            title={lead.message}
                                        >
                                            {lead.message}
                                        </div>
                                    </td>

                                    <td className="px-3 py-1.5 text-center border-r border-slate-100">
                                        {lead.file_url ? (
                                            <a
                                                href={lead.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                                title="View file"
                                            >
                                                <Paperclip className="h-3.5 w-3.5" />
                                            </a>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>

                                    <td className="px-3 py-1.5">
                                        <select
                                            value={lead.status || 'New'}
                                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                            disabled={updating === lead.id}
                                            className={`
                                                w-full text-[11px] font-semibold uppercase rounded border-0 px-1 py-0.5 
                                                bg-transparent focus:ring-1 focus:ring-amber-500 cursor-pointer
                                                ${lead.status === 'New' ? 'text-blue-600' :
                                                    lead.status === 'Contacted' ? 'text-yellow-600' :
                                                        lead.status === 'Quoted' ? 'text-purple-600' :
                                                            lead.status === 'Won' ? 'text-green-600' :
                                                                'text-slate-500'}
                                            `}
                                        >
                                            {statuses.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredLeads.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 border-t border-slate-100">
                        <p className="text-slate-500 text-sm">Chưa có dữ liệu phù hợp.</p>
                        {leads.length === 0 && (
                            <button
                                onClick={() => fetch('/api/admin/migrate-v11').then(() => window.location.reload())}
                                className="mt-4 px-3 py-1.5 bg-amber-500 text-white rounded text-xs hover:bg-amber-600 transition-colors"
                            >
                                Khởi tạo dữ liệu mẫu
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
