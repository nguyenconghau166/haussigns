'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { KeywordResult } from '../types';

interface Props {
  keywords: KeywordResult[];
}

const INTENT_COLORS: Record<string, string> = {
  transactional: '#10b981',
  commercial: '#0ea5e9',
  informational: '#6366f1',
  navigational: '#94a3b8',
};

export default function OpportunityChart({ keywords }: Props) {
  if (!keywords.length) return null;

  const intentData = ['transactional', 'commercial', 'informational', 'navigational'].map((intent) => {
    const items = keywords.filter((k) => k.intent === intent);
    return {
      intent: intent.charAt(0).toUpperCase() + intent.slice(1),
      count: items.length,
      avgScore: items.length > 0 ? Math.round(items.reduce((s, k) => s + k.opportunity_score, 0) / items.length) : 0,
      fill: INTENT_COLORS[intent],
    };
  }).filter((d) => d.count > 0);

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={intentData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="intent" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey="avgScore" name="Avg Score" radius={[4, 4, 0, 0]}>
            {intentData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
