'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSeoPages, analyzeUrlAction } from '@/app/actions/seo';
import { Search, Plus, ExternalLink, RefreshCw, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SeoDashboard() {
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [newUrl, setNewUrl] = useState('');

    useEffect(() => {
        loadPages();
    }, []);

    async function loadPages() {
        try {
            setLoading(true);
            const data = await getSeoPages();
            setPages(data || []);
        } catch (error) {
            console.error("Failed to load pages", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAnalyze() {
        if (!newUrl) return;
        setAnalyzing(true);
        try {
            const res = await analyzeUrlAction(newUrl);
            if (res.success) {
                setNewUrl('');
                loadPages();
            } else {
                alert(res.error || "Analysis failed");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        } finally {
            setAnalyzing(false);
        }
    }

    // Calculate generic stats
    const avgSeo = pages.length ? Math.round(pages.reduce((acc, p) => acc + (p.seo_score || 0), 0) / pages.length) : 0;
    const avgAio = pages.length ? Math.round(pages.reduce((acc, p) => acc + (p.aio_score || 0), 0) / pages.length) : 0;
    const totalPages = pages.length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">SEO & AIO Dashboard</h1>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="/about or https://..."
                        className="px-3 py-2 border rounded-md w-64 text-sm"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing || !newUrl}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Analyze New Page
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Average SEO Score</p>
                            <h3 className={`text-3xl font-bold mt-2 ${avgSeo >= 80 ? 'text-green-600' : avgSeo >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {avgSeo}
                            </h3>
                        </div>
                        <div className={`p-2 rounded-lg ${avgSeo >= 80 ? 'bg-green-100 text-green-600' : avgSeo >= 50 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                            <Search className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Based on {totalPages} pages</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Average AIO Score</p>
                            <h3 className={`text-3xl font-bold mt-2 ${avgAio >= 80 ? 'text-purple-600' : avgAio >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {avgAio}
                            </h3>
                        </div>
                        <div className={`p-2 rounded-lg ${avgAio >= 80 ? 'bg-purple-100 text-purple-600' : avgAio >= 50 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">AI Optimization Impact</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Analyzed</p>
                            <h3 className="text-3xl font-bold mt-2 text-gray-900">{totalPages}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Pages tracked</p>
                </div>
            </div>

            {/* Pages Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Analyzed Pages</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3 font-medium">Path / Title</th>
                                <th className="px-6 py-3 font-medium">Type</th>
                                <th className="px-6 py-3 font-medium">SEO Score</th>
                                <th className="px-6 py-3 font-medium">AIO Score</th>
                                <th className="px-6 py-3 font-medium">Last Check</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
                            ) : pages.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No pages analyzed yet. Add one above.</td></tr>
                            ) : (
                                pages.map((page) => (
                                    <tr key={page.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{page.path}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-xs">{page.title || 'No title'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                                {page.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`font-bold ${page.seo_score >= 80 ? 'text-green-600' : page.seo_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {page.seo_score}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`font-bold ${page.aio_score >= 80 ? 'text-purple-600' : page.aio_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {page.aio_score}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(page.last_crawled_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/seo/${page.id}`}
                                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Details <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
