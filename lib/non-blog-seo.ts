import templates from './non-blog-seo-templates.json';

export type NonBlogPageType = 'service' | 'about' | 'solution';

export interface NonBlogSeoInputs {
  primaryKeyword: string;
  secondaryKeywords: string;
  ctaGoal: string;
  internalLinks: string;
  targetWordCount: string;
}

interface TemplateShape {
  defaults: Record<NonBlogPageType, { label: string; sections: string[] }>;
  qaChecklist: string[];
}

const templateData = templates as TemplateShape;

export function detectPageTypeBySlug(slug: string): NonBlogPageType {
  const normalized = (slug || '').toLowerCase();
  if (normalized.includes('about')) return 'about';
  if (normalized.includes('service')) return 'service';
  return 'solution';
}

export function getNonBlogTemplateOptions() {
  return (Object.keys(templateData.defaults) as NonBlogPageType[]).map((value) => ({
    value,
    label: templateData.defaults[value].label
  }));
}

export function buildNonBlogSeoPrompt(pageType: NonBlogPageType, inputs: NonBlogSeoInputs): string {
  const preset = templateData.defaults[pageType];
  const sectionLines = preset.sections.map((section) => `- ${section}`).join('\n');
  const checklistLines = templateData.qaChecklist.map((item) => `- ${item}`).join('\n');

  return [
    `NON-BLOG PAGE TYPE: ${preset.label}`,
    'SEO FIELDS (required):',
    '- Provide meta_title with 50-60 characters and include the primary keyword near the beginning.',
    '- Provide meta_description with 140-155 characters and include one natural CTA.',
    '- Keep only one H1 and do not duplicate meta_title verbatim.',
    'STRUCTURE (required):',
    sectionLines,
    'INPUTS:',
    `- Primary keyword: ${inputs.primaryKeyword || 'N/A'}`,
    `- Secondary keywords: ${inputs.secondaryKeywords || 'N/A'}`,
    `- CTA goal: ${inputs.ctaGoal || 'N/A'}`,
    `- Internal links (anchor|url): ${inputs.internalLinks || 'N/A'}`,
    `- Target word count: ${inputs.targetWordCount || 'N/A'}`,
    'SELF-QA CHECKLIST (must pass before final output):',
    checklistLines
  ].join('\n');
}
