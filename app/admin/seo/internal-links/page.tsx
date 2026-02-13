"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCcw, Link as LinkIcon, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function InternalLinksPage() {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ rules: 0 });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/internal-links');
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleAction = async (action: 'scan' | 'apply') => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/internal-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            const result = await res.json();

            if (result.success) {
                if (action === 'scan') {
                    setMessage({ type: 'success', text: `Scan complete! Mapped ${result.data.mapped} new keywords.` });
                } else {
                    setMessage({ type: 'success', text: `Applied links! Updated ${result.data.updated} posts.` });
                }
                fetchStats();
            } else {
                setMessage({ type: 'error', text: `Error: ${result.error}` });
            }
        } catch (e) {
            setMessage({ type: 'error', text: "Operation failed" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link href="/admin/seo" className="text-sm text-muted-foreground hover:underline mb-2 block">← Back to SEO</Link>
                    <h1 className="text-3xl font-bold tracking-tight">Internal Linking Strategy</h1>
                    <p className="text-muted-foreground">Automate internal linking to boost SEO and AIO scores.</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.rules}</div>
                        <p className="text-xs text-muted-foreground">Keywords mapped to URLs</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCcw className="h-5 w-5" />
                            Step 1: Discovery
                        </CardTitle>
                        <CardDescription>
                            Analyze all Products, Projects, and Posts to generate keyword mapping rules using AI.
                            This will not change content yet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => handleAction('scan')}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Scan Content & Generate Rules
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                            <LinkIcon className="h-5 w-5" />
                            Step 2: Injection
                        </CardTitle>
                        <CardDescription>
                            Apply the rules to inject internal links into <b>Posts</b>.
                            <br />
                            <span className="flex items-center gap-1 text-orange-600 mt-2 text-xs font-semibold">
                                <AlertTriangle className="h-3 w-3" />
                                Modifies content in database.
                            </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => handleAction('apply')}
                            disabled={loading}
                            variant="destructive"
                            className="w-full"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Apply Links to Content
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
