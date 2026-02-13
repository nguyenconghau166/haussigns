'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getSeoPageDetails, analyzeUrlAction } from '@/app/actions/seo';
import { ArrowLeft, RefreshCw, CheckCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';

export default function SeoPageDetail() {
    const params = useParams();
    const id = params?.id as string;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    async function loadData() {
        try {
            setLoading(true);
            const res = await getSeoPageDetails(id);
            setData(res);
        } catch (error) {
            console.error("Failed to load page details", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleReanalyze() {
        if (!data?.page?.path) return;
        setAnalyzing(true);
        try {
            const res = await analyzeUrlAction(data.page.path);
            if (res.success) {
                loadData();
            } else {
                alert(res.error || "Analysis failed");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setAnalyzing(false);
        }
    }

    if (loading) return <div className="p-8 text-center">Loading details...</div>;
    if (!data || !data.page) return <div className="p-8 text-center">Page not found</div>;

    const { page, suggestions } = data;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/seo" className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        SEO Analysis
                        <a href={page.path} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            <ExternalLink className="w-5 h-5" />
                        </a>
                    </h1>
                    <p className="text-gray-500 text-sm">{page.path}</p>
                </div>
                <button
                    onClick={handleReanalyze}
                    disabled={analyzing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                    Re-analyze
                </button>
            </div>

            {/* Top Scores */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <ScoreCard label="SEO Score" value={page.seo_score} type="seo" />
                <ScoreCard label="AIO Score" value={page.aio_score} type="aio" />
                <StatCard label="Word Count" value={page.word_count} />
                <StatCard label="Last Crawl" value={new Date(page.last_crawled_at).toLocaleDateString()} />
            </div>

            {/* Metadata Check */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-4">Metadata Snapshot</h3>
                <div className="space-y-4">
                    <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Title Tag ({page.title?.length || 0} chars)</span>
                        <p className="font-medium text-gray-900 border-l-4 border-blue-500 pl-3 py-1 bg-gray-50 mt-1">
                            {page.title || <span className="text-red-500 italic">Missing</span>}
                        </p>
                    </div>
                    <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Meta Description ({page.meta_description?.length || 0} chars)</span>
                        <p className="font-medium text-gray-900 border-l-4 border-blue-500 pl-3 py-1 bg-gray-50 mt-1">
                            {page.meta_description || <span className="text-red-500 italic">Missing</span>}
                        </p>
                    </div>
                    <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">H1 Tag</span>
                        <p className="font-medium text-gray-900 border-l-4 border-blue-500 pl-3 py-1 bg-gray-50 mt-1">
                            {page.h1 || <span className="text-red-500 italic">Missing</span>}
                        </p>
                    </div>
                </div>
            </div>

            {/* Suggestions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-4">Optimization Suggestions</h3>
                {suggestions.length === 0 ? (
                    <div className="text-center py-8 text-green-600">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No issues found! Great job.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {suggestions.map((s: any) => (
                            <div key={s.id} className={`p-4 rounded-lg flex items-start gap-3 border ${s.priority === 'High' ? 'bg-red-50 border-red-100' : s.priority === 'Medium' ? 'bg-yellow-50 border-yellow-100' : 'bg-blue-50 border-blue-100'}`}>
                                {s.priority === 'High' ? <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" /> : <Info className="w-5 h-5 text-blue-600 mt-0.5" />}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${s.priority === 'High' ? 'bg-red-200 text-red-800' : s.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'}`}>
                                            {s.priority}
                                        </span>
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.category}</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900">{s.issue}</h4>
                                    <p className="text-sm text-gray-700 mt-1">{s.suggestion}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ScoreCard({ label, value, type }: { label: string, value: number, type: 'seo' | 'aio' }) {
    let colorClass = 'text-red-600';
    let bgClass = 'bg-red-50';
    if (value >= 80) { colorClass = type === 'aio' ? 'text-purple-600' : 'text-green-600'; bgClass = type === 'aio' ? 'bg-purple-50' : 'bg-green-50'; }
    else if (value >= 50) { colorClass = 'text-yellow-600'; bgClass = 'bg-yellow-50'; }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{label}</p>
            <div className={`mt-2 text-4xl font-black ${colorClass}`}>
                {value}
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-3 overflow-hidden">
                <div className={`h-full ${type === 'aio' && value >= 80 ? 'bg-purple-500' : value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${value}%` }}></div>
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string, value: string | number }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col justify-center">
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{label}</p>
            <div className="mt-2 text-2xl font-bold text-gray-900">
                {value}
            </div>
        </div>
    );
}
