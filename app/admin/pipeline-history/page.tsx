'use client';

import { useState, useEffect } from 'react';
import {
    Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp,
    Bot, Loader2, ArrowRight, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PipelineRun {
    id: string;
    status: string;
    started_at: string;
    completed_at: string | null;
    topics_found: number;
    topics_approved: number;
    articles_created: number;
    images_generated: number;
    error_log: string | null;
    trigger_type: string;
    details: any;
}

interface PipelineLog {
    id: string;
    batch_id: string;
    agent_name: string;
    action: string;
    status: string;
    details: any;
    created_at: string;
}

export default function PipelineHistoryPage() {
    const [runs, setRuns] = useState<PipelineRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRun, setExpandedRun] = useState<string | null>(null);
    const [logs, setLogs] = useState<Record<string, PipelineLog[]>>({});
    const [loadingLogs, setLoadingLogs] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        loadRuns();
    }, [filter]);

    const loadRuns = async () => {
        setLoading(true);
        try {
            const url = filter === 'all'
                ? '/api/admin/pipeline/history?limit=50'
                : `/api/admin/pipeline/history?limit=50&status=${filter}`;
            const res = await fetch(url);
            const data = await res.json();
            setRuns(data.runs || []);
        } catch (error) {
            console.error('Failed to load runs:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLogs = async (runId: string) => {
        if (logs[runId]) return; // Already loaded
        setLoadingLogs(runId);
        try {
            const res = await fetch(`/api/admin/pipeline/logs?batch_id=${runId}`);
            const data = await res.json();
            setLogs(prev => ({ ...prev, [runId]: data.logs || [] }));
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setLoadingLogs(null);
        }
    };

    const toggleExpand = async (runId: string) => {
        if (expandedRun === runId) {
            setExpandedRun(null);
        } else {
            setExpandedRun(runId);
            await loadLogs(runId);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            failed: 'bg-red-100 text-red-700 border-red-200',
            running: 'bg-blue-100 text-blue-700 border-blue-200',
            partial: 'bg-amber-100 text-amber-700 border-amber-200',
        };
        const icons: Record<string, any> = {
            completed: CheckCircle,
            failed: XCircle,
            running: Loader2,
            partial: AlertCircle,
        };
        const labels: Record<string, string> = {
            completed: 'Hoàn thành',
            failed: 'Lỗi',
            running: 'Đang chạy',
            partial: 'Chạy một phần',
        };
        const Icon = icons[status] || AlertCircle;
        return (
            <span className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border', styles[status] || 'bg-slate-100 text-slate-600')}>
                <Icon className={cn('h-3 w-3', status === 'running' && 'animate-spin')} />
                {labels[status] || status}
            </span>
        );
    };

    const getAgentColor = (agent: string) => {
        const colors: Record<string, string> = {
            Researcher: 'text-purple-600 bg-purple-50',
            Evaluator: 'text-blue-600 bg-blue-50',
            Writer: 'text-amber-600 bg-amber-50',
            'Visual Inspector': 'text-emerald-600 bg-emerald-50',
        };
        return colors[agent] || 'text-slate-600 bg-slate-50';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm">Đang tải lịch sử...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Lịch sử Pipeline</h1>
                    <p className="text-slate-500 mt-1">Xem lại các lần chạy AI Pipeline và kết quả</p>
                </div>
                <div className="flex gap-2">
                    {['all', 'completed', 'failed', 'partial'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                filter === f
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            )}
                        >
                            {f === 'all' ? 'Tất cả' : f === 'completed' ? 'Hoàn thành' : f === 'failed' ? 'Lỗi' : 'Một phần'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Runs List */}
            {runs.length === 0 ? (
                <Card className="border-0 shadow-md">
                    <CardContent className="py-12 text-center">
                        <Bot className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Chưa có lịch sử chạy Pipeline</p>
                        <p className="text-sm text-slate-400 mt-1">Hãy chạy AI Pipeline từ trang Command Center</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {runs.map((run) => (
                        <Card key={run.id} className="border-0 shadow-md overflow-hidden">
                            <div
                                className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                onClick={() => toggleExpand(run.id)}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Status Icon */}
                                    <div className={cn(
                                        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                                        run.status === 'completed' ? 'bg-emerald-100' :
                                            run.status === 'failed' ? 'bg-red-100' :
                                                run.status === 'partial' ? 'bg-amber-100' : 'bg-blue-100'
                                    )}>
                                        {run.status === 'completed' ? <CheckCircle className="h-5 w-5 text-emerald-600" /> :
                                            run.status === 'failed' ? <XCircle className="h-5 w-5 text-red-600" /> :
                                                run.status === 'partial' ? <AlertCircle className="h-5 w-5 text-amber-600" /> :
                                                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(run.status)}
                                            <span className="text-xs text-slate-400">
                                                {run.trigger_type === 'manual' ? '🖱️ Thủ công' : '⏰ Tự động'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(run.started_at).toLocaleString('vi-VN')}
                                            </span>
                                            {run.completed_at && (
                                                <span>
                                                    ⏱️ {Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-6 text-center">
                                        <div>
                                            <p className="text-lg font-bold text-slate-900">{run.topics_found}</p>
                                            <p className="text-[10px] text-slate-400">Nghiên cứu</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-slate-900">{run.topics_approved}</p>
                                            <p className="text-[10px] text-slate-400">Duyệt</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-amber-600">{run.articles_created}</p>
                                            <p className="text-[10px] text-slate-400">Bài viết</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-slate-900">{run.images_generated}</p>
                                            <p className="text-[10px] text-slate-400">Ảnh</p>
                                        </div>
                                    </div>

                                    {/* Expand Toggle */}
                                    <div className="flex-shrink-0">
                                        {expandedRun === run.id ? (
                                            <ChevronUp className="h-5 w-5 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-slate-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Error */}
                                {run.error_log && (
                                    <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                                        {run.error_log}
                                    </div>
                                )}
                            </div>

                            {/* Expanded Logs */}
                            {expandedRun === run.id && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                                    <p className="text-sm font-semibold text-slate-700 mb-3">Chi tiết hoạt động Agent</p>
                                    {loadingLogs === run.id ? (
                                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {(logs[run.id] || []).map((log) => (
                                                <div key={log.id} className="flex items-start gap-3 text-xs">
                                                    <span className="text-slate-400 whitespace-nowrap w-20">
                                                        {new Date(log.created_at).toLocaleTimeString('vi-VN')}
                                                    </span>
                                                    <span className={cn(
                                                        'px-2 py-0.5 rounded-md font-semibold w-28 text-center flex-shrink-0',
                                                        getAgentColor(log.agent_name)
                                                    )}>
                                                        {log.agent_name}
                                                    </span>
                                                    <span className={cn(
                                                        log.status === 'success' ? 'text-emerald-600' :
                                                            log.status === 'failed' ? 'text-red-600' :
                                                                log.status === 'running' ? 'text-blue-600' : 'text-slate-600'
                                                    )}>
                                                        {log.action}
                                                    </span>
                                                </div>
                                            ))}
                                            {(!logs[run.id] || logs[run.id].length === 0) && (
                                                <p className="text-slate-400 text-sm italic">Không có log chi tiết</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
