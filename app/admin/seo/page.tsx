'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSeoPages, analyzeUrlAction, bulkAnalyzeFromSitemapAction, rescanOutdatedPagesAction } from '@/app/actions/seo';
import { Search, Plus, ExternalLink, RefreshCw, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SeoDashboard() {
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [migrating, setMigrating] = useState(false);
    const [bulkAnalyzing, setBulkAnalyzing] = useState(false);
    const [bulkLimit, setBulkLimit] = useState(25);
    const [rescanLoading, setRescanLoading] = useState(false);
    const [outdatedDays, setOutdatedDays] = useState(7);

    useEffect(() => {
        loadPages();
    }, []);

    async function loadPages() {
        try {
            setLoading(true);
            setErrorMessage('');
            const data = await getSeoPages();
            setPages(data || []);
        } catch (error) {
            console.error("Failed to load pages", error);
            if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('Failed to load SEO data.');
            }
        } finally {
            setLoading(false);
        }
    }

    async function runMigration() {
        setMigrating(true);
        try {
            const res = await fetch('/api/admin/migrate-v15');
            const data = await res.json();
            if (!data.success) {
                alert(data.error || 'Migration failed');
                return;
            }
            await loadPages();
        } catch (error) {
            console.error(error);
            alert('Migration failed');
        } finally {
            setMigrating(false);
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

    async function handleBulkScan() {
        setBulkAnalyzing(true);
        try {
            const res = await bulkAnalyzeFromSitemapAction(bulkLimit);
            if (!res.success) {
                alert(res.error || 'Bulk scan failed');
                return;
            }

            await loadPages();
            const failedCount = res.failed ?? 0;
            const failurePart = failedCount > 0 ? `, ${failedCount} failed` : '';
            alert(
                `Sitemap scan complete. Scanned ${res.scanned} URLs, skipped ${res.existing} existing pages, analyzed ${res.analyzed}${failurePart}.`
            );
        } catch (error) {
            console.error(error);
            alert('Bulk scan failed');
        } finally {
            setBulkAnalyzing(false);
        }
    }

    async function handleRescanOutdated() {
        setRescanLoading(true);
        try {
            const res = await rescanOutdatedPagesAction(outdatedDays, bulkLimit);
            if (!res.success) {
                alert(res.error || 'Re-scan failed');
                return;
            }

            await loadPages();
            const failedCount = res.failed ?? 0;
            const failurePart = failedCount > 0 ? `, ${failedCount} failed` : '';
            alert(
                `Outdated re-scan complete. Tracked ${res.tracked}, stale ${res.stale}, re-analyzed ${res.reanalyzed}${failurePart}.`
            );
        } catch (error) {
            console.error(error);
            alert('Re-scan failed');
        } finally {
            setRescanLoading(false);
        }
    }

    // Calculate generic stats
    const avgSeo = pages.length ? Math.round(pages.reduce((acc, p) => acc + (p.seo_score || 0), 0) / pages.length) : 0;
    const avgAio = pages.length ? Math.round(pages.reduce((acc, p) => acc + (p.aio_score || 0), 0) / pages.length) : 0;
    const totalPages = pages.length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-4 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900">SEO & AIO Dashboard</h1>
                <div className="flex gap-2 flex-wrap justify-end">
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min={1}
                            max={100}
                            className="px-3 py-2 border rounded-md w-24 text-sm"
                            value={bulkLimit}
                            onChange={(e) => setBulkLimit(Number(e.target.value || 25))}
                        />
                        <button
                            onClick={handleBulkScan}
                            disabled={bulkAnalyzing || loading || bulkLimit < 1}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {bulkAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Scan Sitemap
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min={1}
                            max={365}
                            className="px-3 py-2 border rounded-md w-24 text-sm"
                            value={outdatedDays}
                            onChange={(e) => setOutdatedDays(Number(e.target.value || 7))}
                        />
                        <button
                            onClick={handleRescanOutdated}
                            disabled={rescanLoading || loading || outdatedDays < 1}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {rescanLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Re-scan {outdatedDays}d+
                        </button>
                    </div>
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

            {errorMessage && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 p-4 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 mt-0.5" />
                        <div>
                            <p className="font-semibold">SEO data unavailable</p>
                            <p className="text-sm">{errorMessage}</p>
                        </div>
                    </div>
                    <button
                        onClick={runMigration}
                        disabled={migrating}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 whitespace-nowrap"
                    >
                        {migrating ? 'Initializing...' : 'Run v15 Migration'}
                    </button>
                </div>
            )}

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
