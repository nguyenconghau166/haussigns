'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  buildNonBlogSeoPrompt,
  detectPageTypeBySlug,
  getNonBlogTemplateOptions,
  type NonBlogPageType
} from '@/lib/non-blog-seo';

interface NonBlogSeoTemplatePanelProps {
  slug: string;
  onPromptChange: (prompt: string) => void;
  onApplyToBrief?: (payload: { mustInclude: string; entityFocus: string }) => void;
}

export default function NonBlogSeoTemplatePanel({ slug, onPromptChange, onApplyToBrief }: NonBlogSeoTemplatePanelProps) {
  const options = useMemo(() => getNonBlogTemplateOptions(), []);
  const [pageType, setPageType] = useState<NonBlogPageType>(() => detectPageTypeBySlug(slug));
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState('');
  const [ctaGoal, setCtaGoal] = useState('Contact us for consultation');
  const [internalLinks, setInternalLinks] = useState('');
  const [targetWordCount, setTargetWordCount] = useState('900-1400');

  useEffect(() => {
    setPageType(detectPageTypeBySlug(slug));
  }, [slug]);

  const generatedPrompt = useMemo(
    () =>
      buildNonBlogSeoPrompt(pageType, {
        primaryKeyword,
        secondaryKeywords,
        ctaGoal,
        internalLinks,
        targetWordCount
      }),
    [ctaGoal, internalLinks, pageType, primaryKeyword, secondaryKeywords, targetWordCount]
  );

  useEffect(() => {
    onPromptChange(generatedPrompt);
  }, [generatedPrompt, onPromptChange]);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Non-Blog SEO Template</p>

      <div>
        <label className="text-xs font-medium text-slate-600">Page Type</label>
        <select
          value={pageType}
          onChange={(e) => setPageType(e.target.value as NonBlogPageType)}
          className="w-full mt-1 p-2 text-sm border rounded-lg"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600">Primary Keyword</label>
        <input
          value={primaryKeyword}
          onChange={(e) => setPrimaryKeyword(e.target.value)}
          className="w-full mt-1 p-2 text-sm border rounded-lg"
          placeholder="e.g. custom signage services"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600">Secondary Keywords</label>
        <input
          value={secondaryKeywords}
          onChange={(e) => setSecondaryKeywords(e.target.value)}
          className="w-full mt-1 p-2 text-sm border rounded-lg"
          placeholder="kw1, kw2, kw3"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-slate-600">CTA Goal</label>
          <input
            value={ctaGoal}
            onChange={(e) => setCtaGoal(e.target.value)}
            className="w-full mt-1 p-2 text-sm border rounded-lg"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Word Count</label>
          <input
            value={targetWordCount}
            onChange={(e) => setTargetWordCount(e.target.value)}
            className="w-full mt-1 p-2 text-sm border rounded-lg"
            placeholder="900-1400"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600">Internal Links (anchor|url; ...)</label>
        <textarea
          value={internalLinks}
          onChange={(e) => setInternalLinks(e.target.value)}
          className="w-full mt-1 p-2 text-xs border rounded-lg h-16"
          placeholder="services page|https://... ; contact|https://..."
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600">Auto-filled Prompt Template</label>
        <textarea
          value={generatedPrompt}
          readOnly
          className="w-full mt-1 p-2 text-[11px] border rounded-lg h-40 bg-slate-50"
        />
      </div>

      {onApplyToBrief && (
        <button
          type="button"
          onClick={() =>
            onApplyToBrief({
              mustInclude: generatedPrompt,
              entityFocus: [primaryKeyword, secondaryKeywords].filter(Boolean).join(' | ')
            })
          }
          className="w-full py-2 rounded-lg border border-amber-300 bg-white text-amber-800 text-sm font-medium hover:bg-amber-100"
        >
          Apply Template To AI Brief
        </button>
      )}
    </div>
  );
}
