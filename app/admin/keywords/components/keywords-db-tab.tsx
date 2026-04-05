'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Download, Rocket, Layers, Star, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { KeywordDbRow, KeywordStatus, KeywordIntent } from '../types';
import { getDifficultyClass, getOpportunityClass, INTENT_COLORS, STATUS_COLORS, STATUS_LABELS } from '../types';

export default function KeywordsDbTab() {
  const [keywords, setKeywords] = useState<KeywordDbRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [clusters, setClusters] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [intentFilter, setIntentFilter] = useState('');
  const [clusterFilter, setClusterFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadKeywords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (intentFilter) params.set('intent', intentFilter);
      if (clusterFilter) params.set('cluster', clusterFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/keywords/db?${params}`);
      const data = await res.json();
      setKeywords(data.keywords || []);
      setStats(data.stats || {});
      setClusters(data.clusters || []);
    } catch {
      setError('Failed to load keywords');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, intentFilter, clusterFilter, search]);

  useEffect(() => { loadKeywords(); }, [loadKeywords]);

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([id]) => id), [selected]);
  const allSelected = keywords.length > 0 && keywords.every((k) => selected[k.id]);

  const updateStatus = async (status: KeywordStatus) => {
    if (!selectedIds.length) return;
    setActionLoading(true);
    try {
      await fetch('/api/admin/keywords/db', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, status }),
      });
      setNotice(`Updated ${selectedIds.length} keywords to "${status}".`);
      setSelected({});
      await loadKeywords();
    } catch { setError('Update failed'); }
    finally { setActionLoading(false); }
  };

  const deleteSelected = async () => {
    if (!selectedIds.length || !confirm(`Xoa ${selectedIds.length} keyword?`)) return;
    setActionLoading(true);
    try {
      await fetch('/api/admin/keywords/db', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      setNotice(`Deleted ${selectedIds.length} keywords.`);
      setSelected({});
      await loadKeywords();
    } catch { setError('Delete failed'); }
    finally { setActionLoading(false); }
  };

  const autoCluster = async () => {
    setActionLoading(true);
    setNotice('');
    try {
      const res = await fetch('/api/admin/keywords/cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'auto' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotice(`Auto-clustered ${data.totalUpdated} keywords into ${data.clusters?.length || 0} groups.`);
      await loadKeywords();
    } catch (e) { setError(e instanceof Error ? e.message : 'Cluster failed'); }
    finally { setActionLoading(false); }
  };

  const pushToPipeline = async () => {
    const kws = keywords.filter((k) => selected[k.id]).map((k) => k.keyword);
    if (!kws.length) return;
    setActionLoading(true);
    try {
      await fetch('/api/admin/keyword-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'push_to_pipeline', keywords: kws }),
      });
      setNotice('Da day keyword sang AI Pipeline.');
    } catch { setError('Push failed'); }
    finally { setActionLoading(false); }
  };

  const exportCsv = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (clusterFilter) params.set('cluster', clusterFilter);
    window.open(`/api/admin/keywords/export?${params}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {(['discovered', 'planned', 'in_progress', 'published', 'skipped'] as KeywordStatus[]).map((s) => (
          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={cn('rounded-lg border p-2 text-center transition-colors', statusFilter === s ? 'border-amber-400 bg-amber-50' : 'hover:bg-slate-50')}>
            <p className="text-lg font-bold text-slate-900">{stats[s] || 0}</p>
            <p className="text-[10px] text-slate-500 uppercase">{STATUS_LABELS[s]}</p>
          </button>
        ))}
        <div className="rounded-lg border p-2 text-center bg-slate-50">
          <p className="text-lg font-bold text-slate-900">{stats.total || 0}</p>
          <p className="text-[10px] text-slate-500 uppercase">Total</p>
        </div>
      </div>

      {/* Filters + Actions */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[150px]">
              <p className="text-xs text-slate-500 mb-1">Search</p>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter keywords..." className="h-9" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Intent</p>
              <select value={intentFilter} onChange={(e) => setIntentFilter(e.target.value)} className="h-9 rounded-md border px-2 text-sm">
                <option value="">All</option>
                <option value="transactional">Transactional</option>
                <option value="commercial">Commercial</option>
                <option value="informational">Informational</option>
                <option value="navigational">Navigational</option>
              </select>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Cluster</p>
              <select value={clusterFilter} onChange={(e) => setClusterFilter(e.target.value)} className="h-9 rounded-md border px-2 text-sm">
                <option value="">All</option>
                {clusters.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadKeywords()} className="gap-1"><RefreshCw className="h-3 w-3" /></Button>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
              <span className="text-xs font-medium text-amber-700">{selectedIds.length} selected:</span>
              <Button variant="outline" size="sm" onClick={() => updateStatus('planned')} disabled={actionLoading} className="h-7 text-xs">Planned</Button>
              <Button variant="outline" size="sm" onClick={() => updateStatus('in_progress')} disabled={actionLoading} className="h-7 text-xs">In Progress</Button>
              <Button variant="outline" size="sm" onClick={() => updateStatus('published')} disabled={actionLoading} className="h-7 text-xs">Published</Button>
              <Button variant="outline" size="sm" onClick={() => updateStatus('skipped')} disabled={actionLoading} className="h-7 text-xs">Skip</Button>
              <Button variant="outline" size="sm" onClick={pushToPipeline} disabled={actionLoading} className="h-7 text-xs gap-1"><Rocket className="h-3 w-3" /> Pipeline</Button>
              <Button variant="outline" size="sm" onClick={deleteSelected} disabled={actionLoading} className="h-7 text-xs gap-1 text-rose-600 hover:text-rose-700"><Trash2 className="h-3 w-3" /> Delete</Button>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={autoCluster} disabled={actionLoading} className="gap-1.5">
              {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Layers className="h-3 w-3" />} Auto-Cluster
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
              <Download className="h-3 w-3" /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...</div>
          ) : keywords.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-lg font-medium">Chua co keyword nao</p>
              <p className="text-sm mt-1">Scan keywords o tab "Nghien cuu" roi luu vao day.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="px-3 py-3">
                      <input type="checkbox" checked={allSelected} onChange={(e) => {
                        const next: Record<string, boolean> = {};
                        keywords.forEach((k) => { next[k.id] = e.target.checked; });
                        setSelected(next);
                      }} />
                    </th>
                    <th className="px-4 py-3">Keyword</th>
                    <th className="px-3 py-3">Score</th>
                    <th className="px-3 py-3">Vol</th>
                    <th className="px-3 py-3">Diff</th>
                    <th className="px-3 py-3">Intent</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Cluster</th>
                    <th className="px-3 py-3">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw) => (
                    <tr key={kw.id} className={cn('border-b hover:bg-slate-50', selected[kw.id] && 'bg-amber-50/50')}>
                      <td className="px-3 py-2.5">
                        <input type="checkbox" checked={Boolean(selected[kw.id])} onChange={(e) => setSelected((p) => ({ ...p, [kw.id]: e.target.checked }))} />
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-slate-900">{kw.keyword}</span>
                        {kw.related_keywords?.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {kw.related_keywords.slice(0, 2).map((r) => (
                              <span key={r} className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-500">{r}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-semibold', getOpportunityClass(kw.opportunity_score))}>{kw.opportunity_score}</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{kw.volume}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn('px-2 py-0.5 rounded text-xs', getDifficultyClass(kw.difficulty))}>{kw.difficulty}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('px-2 py-0.5 rounded text-xs capitalize', INTENT_COLORS[kw.intent])}>{kw.intent}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', STATUS_COLORS[kw.status])}>{STATUS_LABELS[kw.status]}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{kw.cluster_name || '-'}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={cn('h-3 w-3 cursor-pointer', n <= (kw.priority || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300')}
                              onClick={async () => {
                                await fetch('/api/admin/keywords/db', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: kw.id, priority: n }),
                                });
                                loadKeywords();
                              }} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
