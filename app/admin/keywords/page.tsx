'use client';

import { Search, Database, Layers, ShieldCheck, History } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ResearchTab from './components/research-tab';
import KeywordsDbTab from './components/keywords-db-tab';
import ClustersTab from './components/clusters-tab';
import CoverageTab from './components/coverage-tab';
import HistoryTab from './components/history-tab';

export default function KeywordResearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">AI Keyword Research Hub</h1>
        <p className="text-slate-500 mt-1">Nghien cuu, phan tich va quan ly tu khoa de toi uu hoa noi dung va SEO.</p>
      </div>

      <Tabs defaultValue="research" className="w-full">
        <TabsList className="w-full md:w-auto bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="research" className="gap-1.5 data-[state=active]:bg-white rounded-lg px-4">
            <Search className="h-3.5 w-3.5" /> Nghien cuu
          </TabsTrigger>
          <TabsTrigger value="keywords-db" className="gap-1.5 data-[state=active]:bg-white rounded-lg px-4">
            <Database className="h-3.5 w-3.5" /> Kho tu khoa
          </TabsTrigger>
          <TabsTrigger value="clusters" className="gap-1.5 data-[state=active]:bg-white rounded-lg px-4">
            <Layers className="h-3.5 w-3.5" /> Clusters
          </TabsTrigger>
          <TabsTrigger value="coverage" className="gap-1.5 data-[state=active]:bg-white rounded-lg px-4">
            <ShieldCheck className="h-3.5 w-3.5" /> Coverage
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 data-[state=active]:bg-white rounded-lg px-4">
            <History className="h-3.5 w-3.5" /> Lich su
          </TabsTrigger>
        </TabsList>

        <TabsContent value="research">
          <ResearchTab />
        </TabsContent>

        <TabsContent value="keywords-db">
          <KeywordsDbTab />
        </TabsContent>

        <TabsContent value="clusters">
          <ClustersTab />
        </TabsContent>

        <TabsContent value="coverage">
          <CoverageTab />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
