'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Phone, Calendar, FileText, Download, Trash, User, Search, MessageSquare, Paperclip } from 'lucide-react';
import Link from 'next/link';
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

            <div className="grid gap-4">
                {filteredLeads.map((lead) => (
                    <Card key={lead.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Customer Info */}
                                <div className="w-full md:w-1/4 space-y-3">
                                    <div className="flex items-center gap-2 font-bold text-slate-900 text-lg">
                                        <User className="h-5 w-5 text-amber-500" />
                                        {lead.name}
                                    </div>
                                    <div className="space-y-1 text-sm text-slate-600">
                                        {lead.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                                <a href={`mailto:${lead.email}`} className="hover:text-amber-600">{lead.email}</a>
                                            </div>
                                        )}
                                        {lead.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-slate-400" />
                                                <a href={`tel:${lead.phone}`} className="hover:text-amber-600">{lead.phone}</a>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}
                                        </div>
                                    </div>
                                </div>

                                {/* Request Details */}
                                <div className="flex-1 space-y-3 border-l md:border-l-slate-100 md:pl-6">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold uppercase rounded-md border border-amber-100">
                                            {lead.type || 'General Inquiry'}
                                        </span>

                                        {/* Status Selector */}
                                        <select
                                            value={lead.status || 'New'}
                                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                            disabled={updating === lead.id}
                                            className={`text-xs font-bold uppercase rounded-md border px-2 py-1 outline-none cursor-pointer transition-colors ${lead.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    lead.status === 'Contacted' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                        lead.status === 'Quoted' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                            lead.status === 'Won' ? 'bg-green-50 text-green-700 border-green-100' :
                                                                'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}
                                        >
                                            {statuses.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                        {updating === lead.id && <div className="text-xs text-slate-400 animate-pulse">Save...</div>}
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed border border-slate-100">
                                        <MessageSquare className="h-4 w-4 text-slate-400 mb-2 inline mr-2" />
                                        {lead.message}
                                    </div>

                                    {lead.file_url && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <Paperclip className="h-4 w-4 text-slate-400" />
                                            <a
                                                href={lead.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                                            >
                                                Xem file đính kèm <Download className="h-3 w-3" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredLeads.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">Chưa có yêu cầu nào.</p>
                        <p className="text-xs text-slate-400 mt-1">Hãy thử gửi một yêu cầu từ trang Liên hệ.</p>
                        <button
                            onClick={() => fetch('/api/admin/migrate-v11').then(() => window.location.reload())}
                            className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm"
                        >
                            Khởi tạo bảng Leads (v11)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
