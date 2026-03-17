'use client';

import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';

type ContentType = 'material' | 'industry' | 'project' | 'page' | 'product';

interface QualityRequestPayload {
  title: string;
  description?: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  contentType: ContentType;
  entityId?: string;
  entityTable?: string;
}

interface QualityResponse {
  overall: number;
  breakdown: {
    structure: number;
    depth: number;
    seo: number;
    clarity: number;
    trust: number;
  };
  suggestions: string[];
}

interface ContentQualityCardProps {
  payload: QualityRequestPayload;
  autoFixPayload?: Record<string, unknown>;
  onAutoFixApply?: (result: {
    title?: string;
    description?: string;
    content?: string;
    meta_title?: string;
    meta_description?: string;
  }) => void;
}

export default function ContentQualityCard({ payload, autoFixPayload, onAutoFixApply }: ContentQualityCardProps) {
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<QualityResponse | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!payload.entityId || !payload.entityTable) return;
      const params = new URLSearchParams({
        entityId: payload.entityId,
        entityTable: payload.entityTable,
        contentType: payload.contentType,
        limit: '5'
      });
      const res = await fetch(`/api/admin/content-qa/history?${params.toString()}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.history)) {
        setHistory(data.history.map((r: any) => r.score_overall).reverse());
      }
    };
    run();
  }, [payload.entityId, payload.entityTable, payload.contentType]);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) setResult(data);
    } finally {
      setLoading(false);
    }
  };

  const color = result && result.overall >= 80
    ? 'text-emerald-600'
    : result && result.overall >= 65
      ? 'text-amber-600'
      : 'text-red-600';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Content Quality</p>
        {result ? (
          <p className={`text-sm font-bold ${color}`}>{result.overall}/100</p>
        ) : (
          <p className="text-xs text-slate-400">Run before publish</p>
        )}
      </div>

      <button
        type="button"
        onClick={runAnalysis}
        disabled={loading || !payload.title || !payload.content}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-medium disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {loading ? 'Analyzing...' : 'Analyze Quality'}
      </button>

      {result && autoFixPayload && onAutoFixApply && (
        <button
          type="button"
          onClick={async () => {
            setFixing(true);
            try {
              const res = await fetch('/api/admin/content-qa/auto-fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...autoFixPayload,
                  suggestions: result.suggestions
                })
              });
              const data = await res.json();
              if (res.ok) {
                onAutoFixApply(data);
                if (data.qa) setResult(data.qa);
              }
            } finally {
              setFixing(false);
            }
          }}
          disabled={fixing}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-sm font-medium text-amber-800 disabled:opacity-50"
        >
          {fixing ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
          {fixing ? 'Auto-fixing...' : 'Auto-fix Draft'}
        </button>
      )}

      {result && (
        <>
          {history.length > 1 && (
            <p className="text-xs text-slate-500">
              Trend: {history[history.length - 1] - history[0] >= 0 ? '+' : ''}{history[history.length - 1] - history[0]} points over last {history.length} checks
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-slate-50">Structure: <strong>{result.breakdown.structure}</strong></div>
            <div className="p-2 rounded bg-slate-50">Depth: <strong>{result.breakdown.depth}</strong></div>
            <div className="p-2 rounded bg-slate-50">SEO: <strong>{result.breakdown.seo}</strong></div>
            <div className="p-2 rounded bg-slate-50">Clarity: <strong>{result.breakdown.clarity}</strong></div>
          </div>

          {result.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Suggestions
              </p>
              <ul className="space-y-1 text-xs text-slate-600">
                {result.suggestions.slice(0, 4).map((s, i) => (
                  <li key={i} className="leading-relaxed">- {s}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
