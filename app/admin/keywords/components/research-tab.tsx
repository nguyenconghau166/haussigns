'use client';

import { useMemo, useState } from 'react';
import { Search, Loader2, Target, TrendingUp, Sparkles, CircleAlert, Plus, Rocket, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { KeywordResult, ResearchMeta, SortMode, KeywordIntent } from '../types';
import { getDifficultyClass, getOpportunityClass, INTENT_COLORS, SCAN_PRESETS } from '../types';
import OpportunityChart from './opportunity-chart';
import SerpDrawer from './serp-drawer';

interface Props {
  onSaveToDb?: (keywords: KeywordResult[], scanId?: string) => void;
}

export default function ResearchTab({ onSaveToDb }: Props) {
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoDiscovery, setAutoDiscovery] = useState(false);
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [meta, setMeta] = useState<ResearchMeta | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [intentFilter, setIntentFilter] = useState<'all' | KeywordIntent>('all');
  const [minScore, setMinScore] = useState(0);
  const [maxDifficulty, setMaxDifficulty] = useState(100);
  const [sortBy, setSortBy] = useState<SortMode>('opportunity_desc');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoDiscovery && !seed.trim()) {
      setError('Vui long nhap seed keyword hoac bat Auto-Discovery.');
      return;
    }
    setLoading(true);
    setError('');
    setNotice('');
    setResults([]);
    setMeta(null);
    setSelected({});
    try {
      const res = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed, autoDiscovery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Research failed');
      if (data.keywords) setResults(data.keywords);
      setMeta(data.meta || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDb = async () => {
    const selectedKws = results.filter((r) => selected[r.keyword]);
    if (!selectedKws.length) {
      setError('Chon it nhat 1 keyword de luu.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/keywords/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: selectedKws }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setNotice(`Da luu ${data.saved} keyword moi, cap nhat ${data.updated} keyword.`);
      onSaveToDb?.(selectedKws);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handlePushToPipeline = async () => {
    const selectedKws = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
    if (!selectedKws.length) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/keyword-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'push_to_pipeline', keywords: selectedKws }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotice('Da day keyword sang AI Pipeline.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const filteredResults = useMemo(() => {
    return results
      .filter((item) => {
        if (intentFilter !== 'all' && item.intent !== intentFilter) return false;
        if (item.opportunity_score < minScore) return false;
        if (item.difficulty > maxDifficulty) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'volume_desc') return b.volume - a.volume;
        if (sortBy === 'difficulty_asc') return a.difficulty - b.difficulty;
        if (sortBy === 'trend_desc') return b.trend - a.trend;
        if (sortBy === 'keyword_asc') return a.keyword.localeCompare(b.keyword);
        return b.opportunity_score - a.opportunity_score;
      });
  }, [results, intentFilter, minScore, maxDifficulty, sortBy]);

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const allSelected = filteredResults.length > 0 && filteredResults.every((r) => selected[r.keyword]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Market Scan</h2>
          <p className="text-sm text-slate-500">Nghien cuu tu khoa de tim co hoi noi dung va lead.</p>
        </div>
        <button
          type="button"
          onClick={() => setAutoDiscovery((prev) => !prev)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            autoDiscovery ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-slate-900 text-white hover:bg-slate-800'
          )}
        >
          <Target className="h-4 w-4" />
          Auto-Discovery: {autoDiscovery ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-3 flex-col md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="e.g., coffee shop signage" className="pl-10" disabled={loading} />
            </div>
            <Button type="submit" disabled={loading} className="bg-yellow-500 text-slate-900 hover:bg-yellow-400 gap-2 px-6">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Dang quet...' : 'Scan'}
            </Button>
          </form>

          {/* Presets */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SCAN_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => { setSeed(preset.seed); }}
                className="px-2.5 py-1 text-[11px] rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 flex items-start gap-2">
              <CircleAlert className="h-4 w-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}
          {notice && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
          )}
          {meta && (
            <p className="mt-3 text-xs text-slate-500">
              Seed: <span className="font-medium text-slate-700">{meta.seedsUsed.join(', ')}</span> | Focus: <span className="font-medium text-slate-700">{meta.focusAreas}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats + Chart */}
      {results.length > 0 && meta && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 grid grid-cols-2 gap-3">
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-3">
                <p className="text-[10px] text-slate-500 uppercase">Avg Opportunity</p>
                <p className="text-2xl font-bold text-slate-900">{meta.avgOpportunity}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-3">
                <p className="text-[10px] text-slate-500 uppercase">Avg Difficulty</p>
                <p className="text-2xl font-bold text-slate-900">{meta.avgDifficulty}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-sky-500">
              <CardContent className="p-3">
                <p className="text-[10px] text-slate-500 uppercase">Transactional</p>
                <p className="text-2xl font-bold text-slate-900">{meta.transactionalCount}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-indigo-500">
              <CardContent className="p-3">
                <p className="text-[10px] text-slate-500 uppercase">Keywords</p>
                <p className="text-2xl font-bold text-slate-900">{results.length}</p>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Opportunity by Intent</CardTitle>
              </CardHeader>
              <CardContent>
                <OpportunityChart keywords={results} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <CardTitle>Opportunities ({filteredResults.length})</CardTitle>
              <div className="text-xs text-slate-500 flex items-center gap-4">
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Sorted by opportunity</span>
                <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Low difficulty: {filteredResults.filter((r) => r.difficulty <= 35).length}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              <div>
                <p className="text-xs text-slate-500 mb-1">Intent</p>
                <select value={intentFilter} onChange={(e) => setIntentFilter(e.target.value as 'all' | KeywordIntent)} className="w-full h-9 rounded-md border border-slate-200 px-2 text-sm">
                  <option value="all">All intents</option>
                  <option value="transactional">Transactional</option>
                  <option value="commercial">Commercial</option>
                  <option value="informational">Informational</option>
                  <option value="navigational">Navigational</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Min score ({minScore})</p>
                <Input type="number" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value) || 0)} className="h-9" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Max difficulty ({maxDifficulty})</p>
                <Input type="number" min={0} max={100} value={maxDifficulty} onChange={(e) => setMaxDifficulty(Number(e.target.value) || 0)} className="h-9" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Sort</p>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortMode)} className="w-full h-9 rounded-md border border-slate-200 px-2 text-sm">
                  <option value="opportunity_desc">Opportunity (high)</option>
                  <option value="volume_desc">Volume (high)</option>
                  <option value="difficulty_asc">Difficulty (low)</option>
                  <option value="trend_desc">Trend (high)</option>
                  <option value="keyword_asc">A-Z</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={handleSaveToDb} disabled={saving || selectedCount === 0} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> Luu vao Kho ({selectedCount})
              </Button>
              <Button size="sm" onClick={handlePushToPipeline} disabled={saving || selectedCount === 0} className="gap-1.5 bg-slate-900 hover:bg-slate-800">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                Day sang Pipeline ({selectedCount})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="px-3 py-3">
                      <input type="checkbox" checked={allSelected} onChange={(e) => {
                        const next: Record<string, boolean> = {};
                        filteredResults.forEach((r) => { next[r.keyword] = e.target.checked; });
                        setSelected((prev) => ({ ...prev, ...next }));
                      }} />
                    </th>
                    <th className="px-4 py-3">Keyword</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Vol</th>
                    <th className="px-4 py-3">Diff</th>
                    <th className="px-4 py-3">Intent</th>
                    <th className="px-4 py-3">Trend</th>
                    <th className="px-4 py-3">CPC</th>
                    <th className="px-4 py-3">Why</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((item) => (
                    <tr key={item.keyword}>
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={Boolean(selected[item.keyword])} onChange={(e) => setSelected((prev) => ({ ...prev, [item.keyword]: e.target.checked }))} />
                      </td>
                      <td className="px-4 py-3 min-w-[220px]">
                        <button type="button" className="font-medium text-slate-900 hover:text-amber-600 text-left" onClick={() => setExpandedRow(expandedRow === item.keyword ? null : item.keyword)}>
                          {item.keyword}
                        </button>
                        {item.related_keywords?.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {item.related_keywords.slice(0, 3).map((r) => (
                              <span key={r} className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-500">{r}</span>
                            ))}
                          </div>
                        )}
                        {expandedRow === item.keyword && <SerpDrawer keyword={item.keyword} />}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-1 rounded text-xs font-semibold', getOpportunityClass(item.opportunity_score))}>{item.opportunity_score}</span>
                      </td>
                      <td className="px-4 py-3">{item.volume.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-1 rounded text-xs', getDifficultyClass(item.difficulty))}>{item.difficulty}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-1 rounded text-xs capitalize', INTENT_COLORS[item.intent])}>{item.intent}</span>
                      </td>
                      <td className="px-4 py-3">{item.trend}</td>
                      <td className="px-4 py-3">${item.cpc.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-600 min-w-[200px] text-xs">{item.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredResults.length === 0 && <p className="mt-4 text-sm text-slate-500">Khong co keyword phu hop.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
