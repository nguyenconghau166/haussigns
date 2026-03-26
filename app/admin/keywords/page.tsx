'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, Target, TrendingUp, Sparkles, CircleAlert, Plus, Rocket, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type KeywordIntent = 'transactional' | 'commercial' | 'informational' | 'navigational';

interface KeywordResult {
  keyword: string;
  volume: number;
  difficulty: number;
  intent: KeywordIntent;
  trend: number;
  cpc: number;
  local_opportunity: number;
  rationale: string;
  related_keywords: string[];
  opportunity_score: number;
}

interface ResearchMeta {
  autoDiscovery: boolean;
  seedsUsed: string[];
  focusAreas: string;
  count: number;
  avgDifficulty: number;
  avgOpportunity: number;
  transactionalCount: number;
}

interface HistoryEntry {
  id: string;
  created_at: string;
  seed_input: string | null;
  auto_discovery: boolean;
  seeds_used: string[];
  focus_areas: string;
  result_count: number;
  avg_difficulty: number;
  avg_opportunity: number;
  transactional_count: number;
}

type SortMode = 'opportunity_desc' | 'volume_desc' | 'difficulty_asc' | 'trend_desc' | 'keyword_asc';

function getDifficultyClass(difficulty: number): string {
  if (difficulty <= 35) return 'bg-emerald-100 text-emerald-700';
  if (difficulty <= 60) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

function getIntentClass(intent: KeywordIntent): string {
  if (intent === 'transactional') return 'bg-emerald-100 text-emerald-700';
  if (intent === 'commercial') return 'bg-sky-100 text-sky-700';
  if (intent === 'informational') return 'bg-indigo-100 text-indigo-700';
  return 'bg-slate-200 text-slate-700';
}

function getOpportunityClass(score: number): string {
  if (score >= 80) return 'bg-emerald-600 text-white';
  if (score >= 65) return 'bg-amber-500 text-slate-950';
  return 'bg-slate-700 text-white';
}

export default function KeywordResearchPage() {
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
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
  const [contentPlan, setContentPlan] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const loadSupportData = async () => {
    setLoadingHistory(true);
    try {
      const [planRes, historyRes] = await Promise.all([
        fetch('/api/admin/keyword-plan'),
        fetch('/api/admin/keywords/history?limit=8'),
      ]);

      if (planRes.ok) {
        const planData = await planRes.json();
        setContentPlan(Array.isArray(planData.plan) ? planData.plan : []);
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(Array.isArray(historyData.history) ? historyData.history : []);
      }
    } catch {
      // silent fallback for support widgets
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadSupportData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoDiscovery && !seed.trim()) {
      setError('Vui long nhap seed keyword hoac bat Auto-Discovery mode.');
      setResults([]);
      setMeta(null);
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');
    setResults([]);
    setMeta(null);
    setSelected({});

    try {
      const response = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed, autoDiscovery }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Khong the nghien cuu keyword luc nay.');
      }

      if (data.keywords) {
        setResults(data.keywords);
      }
      setMeta(data.meta || null);
      await loadSupportData();
    } catch (error) {
      console.error('Failed to fetch keywords', error);
      setError(error instanceof Error ? error.message : 'Da co loi xay ra khi nghien cuu keyword.');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    const filtered = results.filter((item) => {
      const passIntent = intentFilter === 'all' || item.intent === intentFilter;
      const passScore = item.opportunity_score >= minScore;
      const passDifficulty = item.difficulty <= maxDifficulty;
      return passIntent && passScore && passDifficulty;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === 'volume_desc') return b.volume - a.volume;
      if (sortBy === 'difficulty_asc') return a.difficulty - b.difficulty;
      if (sortBy === 'trend_desc') return b.trend - a.trend;
      if (sortBy === 'keyword_asc') return a.keyword.localeCompare(b.keyword);
      return b.opportunity_score - a.opportunity_score;
    });

    return sorted;
  }, [results, intentFilter, minScore, maxDifficulty, sortBy]);

  const totalVolume = filteredResults.reduce((sum, item) => sum + item.volume, 0);
  const lowDifficulty = filteredResults.filter((item) => item.difficulty <= 35).length;
  const selectedKeywords = useMemo(
    () => Object.entries(selected).filter(([, checked]) => checked).map(([keyword]) => keyword),
    [selected]
  );

  const visibleSelectedCount = filteredResults.filter((item) => selected[item.keyword]).length;
  const allVisibleSelected = filteredResults.length > 0 && visibleSelectedCount === filteredResults.length;

  const toggleVisibleSelection = (checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      filteredResults.forEach((item) => {
        next[item.keyword] = checked;
      });
      return next;
    });
  };

  const runKeywordPlanAction = async (action: 'append_plan' | 'push_to_pipeline' | 'clear_plan') => {
    if (action !== 'clear_plan' && selectedKeywords.length === 0) {
      setError('Vui long chon it nhat 1 keyword de thao tac.');
      return;
    }

    setSavingAction(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/admin/keyword-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, keywords: selectedKeywords }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Khong the cap nhat keyword plan.');
      }

      if (Array.isArray(data.plan)) {
        setContentPlan(data.plan);
      }

      if (action === 'append_plan') {
        setNotice(`Da them ${selectedKeywords.length} keyword vao content plan.`);
      } else if (action === 'push_to_pipeline') {
        setNotice('Da day keyword da chon sang target_keywords_seed cho AI Pipeline.');
      } else {
        setNotice('Da xoa toan bo content plan.');
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Khong the cap nhat keyword plan.');
    } finally {
      setSavingAction(false);
      await loadSupportData();
    }
  };

  const formatDate = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AI Keyword Researcher</h1>
          <p className="text-slate-500 mt-1">Nghien cuu tu khoa co intent cao de tim co hoi noi dung va lead.</p>
        </div>
        <button
          type="button"
          onClick={() => setAutoDiscovery((prev) => !prev)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md transition-colors',
            autoDiscovery
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          )}
        >
          <Target className="h-4 w-4" />
          {autoDiscovery ? 'Auto-Discovery: ON' : 'Auto-Discovery: OFF'}
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Scan</CardTitle>
          <CardDescription>
            Nhap seed keyword de quet co hoi. Bat Auto-Discovery de quet tu bo seed trong cai dat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4 flex-col md:flex-row">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="e.g., coffee shop signage"
                className="w-full pl-10"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-yellow-500 text-slate-900 font-medium px-6 py-2 rounded-md hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Dang quet...' : 'Scan'}
            </Button>
          </form>

          {!!error && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 flex items-start gap-2">
              <CircleAlert className="h-4 w-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!!notice && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {notice}
            </div>
          )}

          {meta && (
            <p className="mt-4 text-xs text-slate-500">
              Seed su dung: <span className="font-medium text-slate-700">{meta.seedsUsed.join(', ')}</span> | Khu vuc:
              <span className="font-medium text-slate-700"> {meta.focusAreas}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && meta && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Avg Opportunity</p>
              <p className="text-2xl font-bold text-slate-900">{meta.avgOpportunity}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Avg Difficulty</p>
              <p className="text-2xl font-bold text-slate-900">{meta.avgDifficulty}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-sky-500">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Transactional</p>
              <p className="text-2xl font-bold text-slate-900">{meta.transactionalCount}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-indigo-500">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Tong Volume</p>
              <p className="text-2xl font-bold text-slate-900">{totalVolume.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <CardTitle>Opportunities Found ({results.length})</CardTitle>
              <div className="text-xs text-slate-500 flex items-center gap-4">
                <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Sorted by opportunity</span>
                <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> Low difficulty: {lowDifficulty}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Intent</p>
                <select
                  value={intentFilter}
                  onChange={(e) => setIntentFilter(e.target.value as 'all' | KeywordIntent)}
                  className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm"
                >
                  <option value="all">All intents</option>
                  <option value="transactional">Transactional</option>
                  <option value="commercial">Commercial</option>
                  <option value="informational">Informational</option>
                  <option value="navigational">Navigational</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Min score ({minScore})</p>
                <Input type="number" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value) || 0)} />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Max difficulty ({maxDifficulty})</p>
                <Input type="number" min={0} max={100} value={maxDifficulty} onChange={(e) => setMaxDifficulty(Number(e.target.value) || 0)} />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Sort</p>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortMode)}
                  className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm"
                >
                  <option value="opportunity_desc">Opportunity (high to low)</option>
                  <option value="volume_desc">Volume (high to low)</option>
                  <option value="difficulty_asc">Difficulty (low to high)</option>
                  <option value="trend_desc">Trend (high to low)</option>
                  <option value="keyword_asc">Keyword (A-Z)</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => runKeywordPlanAction('append_plan')}
                disabled={savingAction || selectedKeywords.length === 0}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Them vao Content Plan ({selectedKeywords.length})
              </Button>
              <Button
                type="button"
                onClick={() => runKeywordPlanAction('push_to_pipeline')}
                disabled={savingAction || selectedKeywords.length === 0}
                className="gap-2 bg-slate-900 hover:bg-slate-800"
              >
                {savingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                Day sang AI Pipeline ({selectedKeywords.length})
              </Button>
              <Link href="/admin/ai-center" className="text-sm text-blue-600 hover:underline">
                Mo AI Center de chay Pipeline
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={(e) => toggleVisibleSelection(e.target.checked)}
                        aria-label="Select all visible keywords"
                      />
                    </th>
                    <th className="px-6 py-3">Keyword</th>
                    <th className="px-6 py-3">Score</th>
                    <th className="px-6 py-3">Vol</th>
                    <th className="px-6 py-3">Diff</th>
                    <th className="px-6 py-3">Intent</th>
                    <th className="px-6 py-3">Trend</th>
                    <th className="px-6 py-3">CPC</th>
                    <th className="px-6 py-3">Why</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((item, idx) => (
                    <tr key={idx} className={cn('bg-white border-b hover:bg-slate-50', selected[item.keyword] ? 'bg-amber-50/40' : '')}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={Boolean(selected[item.keyword])}
                          onChange={(e) => setSelected((prev) => ({ ...prev, [item.keyword]: e.target.checked }))}
                          aria-label={`Select keyword ${item.keyword}`}
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 min-w-[240px]">
                        <div>{item.keyword}</div>
                        {item.related_keywords?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.related_keywords.slice(0, 3).map((related) => (
                              <span key={related} className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-600">
                                {related}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('px-2 py-1 rounded text-xs font-semibold', getOpportunityClass(item.opportunity_score))}>
                          {item.opportunity_score}
                        </span>
                      </td>
                      <td className="px-6 py-4">{item.volume}</td>
                      <td className="px-6 py-4">
                        <span className={cn('px-2 py-1 rounded text-xs', getDifficultyClass(item.difficulty))}>
                          {item.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 capitalize">
                        <span className={cn('px-2 py-1 rounded text-xs', getIntentClass(item.intent))}>{item.intent}</span>
                      </td>
                      <td className="px-6 py-4">{item.trend}</td>
                      <td className="px-6 py-4">${item.cpc.toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-600 min-w-[240px]">
                        <p>{item.rationale}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelected((prev) => ({ ...prev, [item.keyword]: true }))}
                        >
                          Chon
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredResults.length === 0 && (
              <p className="mt-4 text-sm text-slate-500">Khong co keyword nao phu hop bo loc hien tai.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Content Plan Queue</CardTitle>
              <CardDescription>Danh sach keyword da duoc danh dau de lap ke hoach noi dung.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => runKeywordPlanAction('clear_plan')}
              disabled={savingAction || contentPlan.length === 0}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          </CardHeader>
          <CardContent>
            {contentPlan.length === 0 ? (
              <p className="text-sm text-slate-500">Chua co keyword nao trong content plan.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {contentPlan.map((keyword) => (
                  <span key={keyword} className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scan History</CardTitle>
            <CardDescription>Lich su quet keyword luu tren database theo thoi gian.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingHistory && history.length === 0 ? (
              <div className="text-sm text-slate-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Dang tai lich su...
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-slate-500">Chua co lich su scan.</p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">{formatDate(entry.created_at)}</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {entry.auto_discovery ? 'Auto-discovery scan' : `Seed: ${entry.seed_input || '(empty)'}`}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {entry.result_count} keywords | Avg score {entry.avg_opportunity} | Avg diff {entry.avg_difficulty} | Transactional {entry.transactional_count}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
