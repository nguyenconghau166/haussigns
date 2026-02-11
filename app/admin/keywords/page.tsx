'use client';

import { useState } from 'react';
import { Search, Plus, Loader2, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function KeywordResearchPage() {
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);

    try {
      const response = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed }),
      });

      const data = await response.json();
      if (data.keywords) {
        setResults(data.keywords);
      }
    } catch (error) {
      console.error('Failed to fetch keywords', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">AI Keyword Researcher</h1>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800">
          <Target className="h-4 w-4" />
          Auto-Discovery Mode
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Scan</CardTitle>
          <CardDescription>Enter a seed keyword to find high-value opportunities in Metro Manila.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="e.g., 'Coffee shop signage'"
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-slate-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-500 text-slate-900 font-medium px-6 py-2 rounded-md hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Scan
            </button>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Opportunities Found ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3">Keyword</th>
                    <th className="px-6 py-3">Vol</th>
                    <th className="px-6 py-3">Diff</th>
                    <th className="px-6 py-3">Intent</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, idx) => (
                    <tr key={idx} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{item.keyword}</td>
                      <td className="px-6 py-4">{item.volume}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${item.difficulty < 30 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {item.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 capitalize">{item.intent}</td>
                      <td className="px-6 py-4">
                        <button className="text-blue-600 hover:underline flex items-center gap-1">
                          <Plus className="h-3 w-3" /> Plan Content
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
