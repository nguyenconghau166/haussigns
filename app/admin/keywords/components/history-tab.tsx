'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { HistoryEntry, KeywordResult } from '../types';
import { getDifficultyClass, getOpportunityClass, INTENT_COLORS } from '../types';

export default function HistoryTab() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedKeywords, setExpandedKeywords] = useState<KeywordResult[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/keywords/history?limit=20');
      const data = await res.json();
      setHistory(data.history || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedKeywords([]);
      return;
    }

    setExpandedId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/keywords/history?id=${id}`);
      const data = await res.json();
      const entry = data.entry;
      if (entry?.payload?.keywords) {
        setExpandedKeywords(entry.payload.keywords);
      } else {
        setExpandedKeywords([]);
      }
    } catch {
      setExpandedKeywords([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString('vi-VN');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-500"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Clock className="h-12 w-12 mx-auto mb-3 text-slate-300" />
        <p className="text-lg font-medium">Chua co lich su scan</p>
        <p className="text-sm mt-1">Chay scan keyword o tab Nghien cuu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-slate-900">Scan History</h2>
      <p className="text-sm text-slate-500">Click vao 1 scan de xem chi tiet keywords.</p>

      {history.map((entry) => (
        <Card key={entry.id} className={cn('transition-shadow', expandedId === entry.id && 'shadow-md ring-1 ring-amber-200')}>
          <CardHeader className="cursor-pointer py-4" onClick={() => toggleExpand(entry.id)}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  {entry.auto_discovery ? 'Auto-Discovery Scan' : `Seed: ${entry.seed_input || '(empty)'}`}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">{formatDate(entry.created_at)}</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">{entry.result_count}</span> keywords |
                  Score <span className="font-semibold text-slate-900">{entry.avg_opportunity}</span> |
                  Diff <span className="font-semibold text-slate-900">{entry.avg_difficulty}</span> |
                  Transactional <span className="font-semibold text-emerald-600">{entry.transactional_count}</span>
                </div>
                {expandedId === entry.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </div>
          </CardHeader>

          {expandedId === entry.id && (
            <CardContent className="pt-0">
              {loadingDetail ? (
                <div className="flex items-center gap-2 py-4 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading keywords...</div>
              ) : expandedKeywords.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">Khong co du lieu keyword cho scan nay.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] text-slate-600 uppercase bg-slate-50">
                      <tr>
                        <th className="px-3 py-2">Keyword</th>
                        <th className="px-3 py-2">Score</th>
                        <th className="px-3 py-2">Vol</th>
                        <th className="px-3 py-2">Diff</th>
                        <th className="px-3 py-2">Intent</th>
                        <th className="px-3 py-2">Trend</th>
                        <th className="px-3 py-2">CPC</th>
                        <th className="px-3 py-2">Rationale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expandedKeywords.map((kw, i) => (
                        <tr key={i} className="border-b hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-900">{kw.keyword}</td>
                          <td className="px-3 py-2">
                            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', getOpportunityClass(kw.opportunity_score))}>{kw.opportunity_score}</span>
                          </td>
                          <td className="px-3 py-2">{kw.volume}</td>
                          <td className="px-3 py-2">
                            <span className={cn('px-1.5 py-0.5 rounded text-[10px]', getDifficultyClass(kw.difficulty))}>{kw.difficulty}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={cn('px-1.5 py-0.5 rounded text-[10px] capitalize', INTENT_COLORS[kw.intent])}>{kw.intent}</span>
                          </td>
                          <td className="px-3 py-2">{kw.trend}</td>
                          <td className="px-3 py-2">${kw.cpc.toFixed(2)}</td>
                          <td className="px-3 py-2 text-slate-500 max-w-[200px] truncate">{kw.rationale}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
