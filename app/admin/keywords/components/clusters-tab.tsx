'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Layers, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { KeywordDbRow } from '../types';
import { getOpportunityClass, INTENT_COLORS } from '../types';

interface ClusterData {
  name: string;
  keywords: KeywordDbRow[];
  avgOpportunity: number;
}

export default function ClustersTab() {
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [unclustered, setUnclustered] = useState<KeywordDbRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [clustering, setClustering] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/keywords/db?limit=500');
      const data = await res.json();
      const all: KeywordDbRow[] = data.keywords || [];

      const grouped = new Map<string, KeywordDbRow[]>();
      const nocluster: KeywordDbRow[] = [];

      for (const kw of all) {
        if (kw.cluster_name) {
          const group = grouped.get(kw.cluster_name) || [];
          group.push(kw);
          grouped.set(kw.cluster_name, group);
        } else {
          nocluster.push(kw);
        }
      }

      const clusterList: ClusterData[] = Array.from(grouped.entries()).map(([name, keywords]) => ({
        name,
        keywords,
        avgOpportunity: Math.round(keywords.reduce((s, k) => s + (k.opportunity_score || 0), 0) / keywords.length),
      })).sort((a, b) => b.avgOpportunity - a.avgOpportunity);

      setClusters(clusterList);
      setUnclustered(nocluster);
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const autoCluster = async () => {
    setClustering(true);
    setError('');
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
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cluster failed');
    } finally {
      setClustering(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-500"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading clusters...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Keyword Clusters</h2>
          <p className="text-sm text-slate-500">{clusters.length} clusters, {unclustered.length} unclustered keywords</p>
        </div>
        <Button onClick={autoCluster} disabled={clustering || unclustered.length === 0} className="gap-2 bg-slate-900 hover:bg-slate-800">
          {clustering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Auto-Cluster ({unclustered.length})
        </Button>
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      {clusters.length === 0 && unclustered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Layers className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p className="text-lg font-medium">Chua co cluster nao</p>
          <p className="text-sm mt-1">Luu keywords tu tab Nghien cuu, roi dung Auto-Cluster.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clusters.map((cluster) => (
          <Card key={cluster.name} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setExpanded(expanded === cluster.name ? null : cluster.name)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-500" /> {cluster.name}
                </CardTitle>
                <span className={cn('px-2 py-0.5 rounded text-xs font-semibold', getOpportunityClass(cluster.avgOpportunity))}>{cluster.avgOpportunity}</span>
              </div>
              <CardDescription>{cluster.keywords.length} keywords</CardDescription>
            </CardHeader>
            {expanded === cluster.name && (
              <CardContent>
                <div className="space-y-1.5">
                  {cluster.keywords.map((kw) => (
                    <div key={kw.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700">{kw.keyword}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px]', INTENT_COLORS[kw.intent])}>{kw.intent}</span>
                        <span className="font-semibold text-slate-900">{kw.opportunity_score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {unclustered.length > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base text-slate-500">Unclustered ({unclustered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {unclustered.slice(0, 30).map((kw) => (
                <span key={kw.id} className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">{kw.keyword}</span>
              ))}
              {unclustered.length > 30 && <span className="px-2 py-1 text-xs text-slate-400">+{unclustered.length - 30} more</span>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
