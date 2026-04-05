'use client';

import { useState } from 'react';
import { Loader2, Search, MessageCircleQuestion, Lightbulb, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SerpAnalysis {
  people_also_ask?: string[];
  serp_features?: string[];
  content_angles?: Array<{ angle: string; description: string; content_type: string }>;
  competitor_themes?: string[];
  content_recommendation?: string;
}

interface Props {
  keyword: string;
}

export default function SerpDrawer({ keyword }: Props) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SerpAnalysis | null>(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/keywords/serp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'SERP analysis failed');
      setAnalysis(data.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (!analysis && !loading) {
    return (
      <Button variant="outline" size="sm" onClick={analyze} className="gap-1.5 text-xs">
        <Search className="h-3 w-3" /> SERP Analysis
      </Button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
        <Loader2 className="h-3 w-3 animate-spin" /> Analyzing SERP...
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-rose-600">{error}</p>;
  }

  if (!analysis) return null;

  return (
    <div className="mt-3 space-y-3 bg-slate-50 rounded-lg p-3 text-xs border border-slate-200">
      {analysis.people_also_ask && analysis.people_also_ask.length > 0 && (
        <div>
          <p className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
            <MessageCircleQuestion className="h-3 w-3" /> People Also Ask
          </p>
          <ul className="space-y-0.5 text-slate-600">
            {analysis.people_also_ask.map((q, i) => (
              <li key={i} className="pl-3 border-l-2 border-sky-200">{q}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.content_angles && analysis.content_angles.length > 0 && (
        <div>
          <p className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
            <Lightbulb className="h-3 w-3" /> Content Angles
          </p>
          <div className="space-y-1">
            {analysis.content_angles.map((angle, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-medium shrink-0">{angle.content_type}</span>
                <div>
                  <span className="font-medium text-slate-800">{angle.angle}</span>
                  <span className="text-slate-500 ml-1">{angle.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.serp_features && analysis.serp_features.length > 0 && (
        <div>
          <p className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
            <Target className="h-3 w-3" /> SERP Features
          </p>
          <div className="flex flex-wrap gap-1">
            {analysis.serp_features.map((f, i) => (
              <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px]">{f}</span>
            ))}
          </div>
        </div>
      )}

      {analysis.content_recommendation && (
        <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-emerald-800">
          <span className="font-semibold">Recommendation:</span> {analysis.content_recommendation}
        </div>
      )}
    </div>
  );
}
