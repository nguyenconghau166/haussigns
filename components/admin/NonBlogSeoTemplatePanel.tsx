'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  buildNonBlogSeoPrompt,
  detectPageTypeBySlug,
  getNonBlogTemplateOptions,
  type NonBlogPageType
} from '@/lib/non-blog-seo';
import type { AIBrief } from '@/components/admin/AIBriefPanel';

interface NonBlogSeoTemplatePanelProps {
  slug: string;
  onPromptChange: (prompt: string) => void;
  /** Unified callback: provides both the full aiBrief and seoPromptTemplate */
  onBriefChange?: (brief: AIBrief, seoPrompt: string) => void;
  /** Initial brief values (optional) */
  initialBrief?: Partial<AIBrief>;
}

export default function NonBlogSeoTemplatePanel({ slug, onPromptChange, onBriefChange, initialBrief }: NonBlogSeoTemplatePanelProps) {
  const options = useMemo(() => getNonBlogTemplateOptions(), []);
  const [pageType, setPageType] = useState<NonBlogPageType>(() => detectPageTypeBySlug(slug));

  // SEO fields
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState('');
  const [ctaGoal, setCtaGoal] = useState('Contact us for consultation');
  const [internalLinks, setInternalLinks] = useState('');
  const [targetWordCount, setTargetWordCount] = useState('900-1400');

  // Brief fields (merged from AIBriefPanel)
  const [intent, setIntent] = useState<AIBrief['intent']>(initialBrief?.intent || 'commercial');
  const [funnelStage, setFunnelStage] = useState<AIBrief['funnelStage']>(initialBrief?.funnelStage || 'consideration');
  const [persona, setPersona] = useState(initialBrief?.persona || 'Business owner or purchasing manager in Metro Manila');
  const [tone, setTone] = useState(initialBrief?.tone || 'Professional and practical');
  const [avoidClaims, setAvoidClaims] = useState(initialBrief?.avoidClaims || 'Avoid unrealistic guarantees or unsupported claims');

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

  // Emit prompt changes
  useEffect(() => {
    onPromptChange(generatedPrompt);
  }, [generatedPrompt, onPromptChange]);

  // Build and emit unified brief
  useEffect(() => {
    if (!onBriefChange) return;
    const brief: AIBrief = {
      intent,
      persona,
      funnelStage,
      tone,
      mustInclude: generatedPrompt,
      avoidClaims,
      entityFocus: [primaryKeyword, secondaryKeywords].filter(Boolean).join(' | '),
    };
    onBriefChange(brief, generatedPrompt);
  }, [intent, persona, funnelStage, tone, avoidClaims, primaryKeyword, secondaryKeywords, generatedPrompt, onBriefChange]);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-700">SEO Content Template</p>

      {/* Row 1: Page Type + Intent + Funnel */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-medium text-slate-600">Page Type</label>
          <select value={pageType} onChange={(e) => setPageType(e.target.value as NonBlogPageType)} className="w-full mt-1 p-2 text-sm border rounded-lg">
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Intent</label>
          <select value={intent} onChange={(e) => setIntent(e.target.value as AIBrief['intent'])} className="w-full mt-1 p-2 text-sm border rounded-lg">
            <option value="informational">Informational</option>
            <option value="commercial">Commercial</option>
            <option value="transactional">Transactional</option>
            <option value="navigational">Navigational</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Funnel Stage</label>
          <select value={funnelStage} onChange={(e) => setFunnelStage(e.target.value as AIBrief['funnelStage'])} className="w-full mt-1 p-2 text-sm border rounded-lg">
            <option value="awareness">Awareness</option>
            <option value="consideration">Consideration</option>
            <option value="decision">Decision</option>
          </select>
        </div>
      </div>

      {/* Row 2: Primary + Secondary Keywords */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-slate-600">Primary Keyword</label>
          <input value={primaryKeyword} onChange={(e) => setPrimaryKeyword(e.target.value)} className="w-full mt-1 p-2 text-sm border rounded-lg" placeholder="e.g. acrylic signage" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Secondary Keywords</label>
          <input value={secondaryKeywords} onChange={(e) => setSecondaryKeywords(e.target.value)} className="w-full mt-1 p-2 text-sm border rounded-lg" placeholder="kw1, kw2, kw3" />
        </div>
      </div>

      {/* Row 3: Persona + Tone */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-slate-600">Persona</label>
          <input value={persona} onChange={(e) => setPersona(e.target.value)} className="w-full mt-1 p-2 text-sm border rounded-lg" placeholder="Who this content is for" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Tone</label>
          <input value={tone} onChange={(e) => setTone(e.target.value)} className="w-full mt-1 p-2 text-sm border rounded-lg" placeholder="Professional, expert..." />
        </div>
      </div>

      {/* Row 4: CTA + Word Count */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-slate-600">CTA Goal</label>
          <input value={ctaGoal} onChange={(e) => setCtaGoal(e.target.value)} className="w-full mt-1 p-2 text-sm border rounded-lg" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Word Count</label>
          <input value={targetWordCount} onChange={(e) => setTargetWordCount(e.target.value)} className="w-full mt-1 p-2 text-sm border rounded-lg" placeholder="900-1400" />
        </div>
      </div>

      {/* Row 5: Avoid Claims */}
      <div>
        <label className="text-xs font-medium text-slate-600">Avoid Claims</label>
        <input value={avoidClaims} onChange={(e) => setAvoidClaims(e.target.value)} className="w-full mt-1 p-2 text-sm border rounded-lg" placeholder="Claims to avoid in content" />
      </div>

      {/* Row 6: Internal Links */}
      <div>
        <label className="text-xs font-medium text-slate-600">Internal Links (anchor|url; ...)</label>
        <textarea value={internalLinks} onChange={(e) => setInternalLinks(e.target.value)} className="w-full mt-1 p-2 text-xs border rounded-lg h-12" placeholder="services|/services ; contact|/contact" />
      </div>

      {/* Generated Prompt (collapsed) */}
      <details className="text-xs">
        <summary className="cursor-pointer font-medium text-slate-500 hover:text-slate-700">View generated prompt</summary>
        <textarea value={generatedPrompt} readOnly className="w-full mt-1 p-2 text-[11px] border rounded-lg h-32 bg-slate-50" />
      </details>
    </div>
  );
}
