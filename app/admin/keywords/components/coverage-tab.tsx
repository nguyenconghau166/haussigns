'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Rocket, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { INTENT_COLORS, getOpportunityClass } from '../types';

interface CoverageItem {
  id: string;
  keyword: string;
  opportunity_score: number;
  intent: string;
  status: string;
  cluster_name: string | null;
  covered: boolean;
  post_title: string | null;
  post_slug: string | null;
}

interface IntentStat {
  intent: string;
  covered: number;
  uncovered: number;
}

export default function CoverageTab() {
  const [items, setItems] = useState<CoverageItem[]>([]);
  const [stats, setStats] = useState({ total: 0, covered: 0, uncovered: 0, coverageRate: 0, intentStats: [] as IntentStat[] });
  const [loading, setLoading] = useState(true);
  const [showCovered, setShowCovered] = useState<'all' | 'covered' | 'uncovered'>('all');
  const [pushing, setPushing] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/keywords/coverage');
      const data = await res.json();
      setItems(data.coverage || []);
      setStats(data.stats || { total: 0, covered: 0, uncovered: 0, coverageRate: 0, intentStats: [] });
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((i) => {
    if (showCovered === 'covered') return i.covered;
    if (showCovered === 'uncovered') return !i.covered;
    return true;
  });

  const pushUncoveredToPipeline = async () => {
    const kws = items.filter((i) => !i.covered).map((i) => i.keyword).slice(0, 20);
    if (!kws.length) return;
    setPushing(true);
    try {
      await fetch('/api/admin/keyword-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'push_to_pipeline', keywords: kws }),
      });
      setNotice(`Da day ${kws.length} keyword chua covered sang Pipeline.`);
    } catch { /* silent */ }
    finally { setPushing(false); }
  };

  const chartData = stats.intentStats.map((s) => ({
    intent: s.intent.charAt(0).toUpperCase() + s.intent.slice(1),
    Covered: s.covered,
    Uncovered: s.uncovered,
  }));

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-500"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Analyzing coverage...</div>;
  }

  if (stats.total === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg font-medium">Chua co keyword nao trong kho</p>
        <p className="text-sm mt-1">Luu keywords tu tab Nghien cuu truoc.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32">
                <circle cx="64" cy="64" r="56" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle cx="64" cy="64" r="56" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray={`${(stats.coverageRate / 100) * 352} 352`} strokeLinecap="round" transform="rotate(-90 64 64)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{stats.coverageRate}%</p>
                  <p className="text-[10px] text-slate-500 uppercase">Coverage</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">{stats.covered}</p>
                <p className="text-[10px] text-slate-500">Covered</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-rose-500">{stats.uncovered}</p>
                <p className="text-[10px] text-slate-500">Uncovered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Coverage by Intent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="intent" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="Covered" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Uncovered" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      {/* Filter + Actions */}
      <div className="flex items-center gap-3">
        {(['all', 'covered', 'uncovered'] as const).map((f) => (
          <button key={f} onClick={() => setShowCovered(f)}
            className={cn('px-3 py-1.5 text-xs rounded-full font-medium transition-colors', showCovered === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
            {f === 'all' ? `All (${stats.total})` : f === 'covered' ? `Covered (${stats.covered})` : `Uncovered (${stats.uncovered})`}
          </button>
        ))}
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={pushUncoveredToPipeline} disabled={pushing || stats.uncovered === 0} className="gap-1.5">
          {pushing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />} Push Uncovered to Pipeline
        </Button>
      </div>

      {/* Keyword List */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-1">
            {filtered.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50">
                {item.covered ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                )}
                <span className="font-medium text-slate-900 text-sm flex-1">{item.keyword}</span>
                <span className={cn('px-1.5 py-0.5 rounded text-[10px] capitalize', INTENT_COLORS[item.intent as keyof typeof INTENT_COLORS] || 'bg-slate-100')}>{item.intent}</span>
                <span className={cn('px-2 py-0.5 rounded text-xs font-semibold', getOpportunityClass(item.opportunity_score))}>{item.opportunity_score}</span>
                {item.covered && item.post_slug && (
                  <a href={`/blog/${item.post_slug}`} target="_blank" rel="noopener" className="text-xs text-sky-600 hover:underline flex items-center gap-0.5">
                    {(item.post_title || '').slice(0, 30)}{(item.post_title || '').length > 30 ? '...' : ''}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
          {filtered.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No keywords match filter.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
