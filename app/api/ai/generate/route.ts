import { NextResponse } from 'next/server';
import { generateSmartContent } from '@/lib/ai/service';
import { generateProjectImage } from '@/lib/image-gen';

type ContentType = 'industry' | 'material' | 'post' | 'page' | 'project' | 'generic';

interface GeneratedPayload {
  title?: string;
  short_description?: string;
  content_html?: string;
  meta_title?: string;
  meta_description?: string;
  key_points?: string[];
  pros?: string[];
  cons?: string[];
  recommended_solutions?: string[];
}

interface AIBrief {
  intent?: string;
  persona?: string;
  funnelStage?: string;
  tone?: string;
  mustInclude?: string;
  avoidClaims?: string;
  entityFocus?: string;
}

function parseJsonFromModel<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;

  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const candidates: string[] = [cleaned];
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) candidates.push(objectMatch[0]);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      continue;
    }
  }

  return fallback;
}

function getContentType(contentType?: string, slug?: string): ContentType {
  if (contentType === 'industry' || contentType === 'material' || contentType === 'post' || contentType === 'page' || contentType === 'project') {
    return contentType;
  }

  if (slug === 'about' || slug === 'services' || slug === 'contact' || slug === 'portfolio') {
    return 'page';
  }

  return 'generic';
}

export async function POST(request: Request) {
  try {
    const { topic, lang, tone, slug, pageContext, contentType, aiBrief, seoPromptTemplate } = await request.json();
    const normalizedType = getContentType(contentType, slug);
    const brief = (aiBrief || {}) as AIBrief;

    const language = lang === 'tl'
      ? 'Tagalog'
      : lang === 'mix'
        ? 'Taglish (English-Tagalog Mix)'
        : 'English';

    const typePromptMap: Record<ContentType, string> = {
      industry: `
      PAGE TYPE: Industry page for signage services.
      Must include:
      1) Industry pain points and buying criteria.
      2) Recommended signage formats (3-5 items).
      3) Compliance/maintenance considerations.
      4) Clear CTA for consultation/ocular inspection.
      Return 4-6 recommended_solutions.
      `,
      material: `
      PAGE TYPE: Material guide.
      Must include:
      1) What this material is and where it performs best.
      2) Real-world durability and maintenance notes.
      3) Balanced pros and cons (minimum 3 each).
      4) Best use cases by business context.
      Return pros and cons arrays.
      `,
      project: `
      PAGE TYPE: Project case study.
      Must include:
      1) Client context + constraints.
      2) Solution architecture (materials, fabrication, installation).
      3) Outcome and impact.
      4) Lessons learned and CTA.
      `,
      page: `
      PAGE TYPE: Core service/business page.
      Must include:
      1) Clear promise in first paragraph.
      2) Process and differentiators.
      3) Practical FAQs.
      4) Strong intent-matching CTA.
      `,
      post: `
      PAGE TYPE: Informational post.
      Must include hook, deep explanation, examples, and practical close.
      `,
      generic: `
      PAGE TYPE: Commercial informational page.
      Must include practical guidance, transparent tradeoffs, and CTA.
      `
    };

    const systemPrompt = `You are an expert Signage Contractor in Metro Manila, Philippines.
    You have 20 years of experience in fabrication (Acrylic, Stainless, Panaflex).
    Your goal is to write high-quality, people-first SEO content that is helpful, specific, and technically reliable.
    Target Audience: Business owners (SME), Corporate Purchasing Heads, Store Managers in Manila.
    Language: ${language}.
    Tone: ${tone}.`;

    const templatePrompt = typeof seoPromptTemplate === 'string' ? seoPromptTemplate.trim() : '';

    const outputPrompt = `
    ${typePromptMap[normalizedType]}

    NON-BLOG SEO TEMPLATE:
    ${templatePrompt || 'Use default SEO behavior for this content type.'}

    AUDIENCE BRIEF:
    - Search intent: ${brief.intent || 'commercial'}
    - Persona: ${brief.persona || 'Business owner / purchasing manager'}
    - Funnel stage: ${brief.funnelStage || 'consideration'}
    - Preferred tone: ${brief.tone || tone}
    - Must include: ${brief.mustInclude || 'N/A'}
    - Claims to avoid: ${brief.avoidClaims || 'Do not use unsupported superlatives'}
    - Entity focus: ${brief.entityFocus || 'N/A'}

    QUALITY RULES (People-first + E-E-A-T):
    - Be specific and practical. Avoid generic filler and repeated claims.
    - Include concrete constraints/tradeoffs where relevant.
    - Keep statements realistic; do not fabricate certifications or guarantees.
    - Make heading hierarchy clear and scannable.

    IMAGE PLACEHOLDERS:
    - Insert exactly 2 image placeholders for long pages.
    - For short pages (contact, portfolio-like), insert 0-1 placeholder.
    - Syntax: <!-- IMAGE: detailed english scene description for AI image generation | Short display caption -->
    - Prompt before | must match paragraph context.

    OUTPUT FORMAT: Return JSON only:
    {
      "title": "Page H1 title",
      "short_description": "1-2 sentence summary for cards/snippets",
      "content_html": "Full HTML content (h2/h3/p/ul/li/table allowed)",
      "meta_title": "SEO title <= 60 chars",
      "meta_description": "SEO description <= 155 chars",
      "key_points": ["Point 1", "Point 2", "Point 3"],
      "pros": ["Only for material pages"],
      "cons": ["Only for material pages"],
      "recommended_solutions": ["For industry pages, 4-6 entries"]
    }`;

    const userPrompt = `Topic: "${topic}"
Page Context: "${pageContext || slug || normalizedType}"
Mention locations naturally when relevant: Makati, BGC, Quezon City.
Focus on durability, budget sensitivity, and visual impact.
Return valid JSON only.`;

    const raw = await generateSmartContent(systemPrompt + outputPrompt, userPrompt) || '';
    const generated = parseJsonFromModel<GeneratedPayload>(raw, {
      title: topic,
      short_description: '',
      content_html: '',
      meta_title: '',
      meta_description: '',
      key_points: [],
      pros: [],
      cons: [],
      recommended_solutions: []
    });

    let content = generated.content_html || '';

    // Process IMAGE placeholders — generate actual images
    const imagePlaceholderRegex = /<!-- IMAGE: (.+?) -->/g;
    let match;
    const replacements: { fullMatch: string; html: string }[] = [];

    while ((match = imagePlaceholderRegex.exec(content)) !== null) {
      const raw = match[1];
      const parts = raw.split('|').map(s => s.trim());
      const prompt = parts[0];
      const caption = parts[1] || '';
      try {
        const imageUrl = await generateProjectImage(
          `professional signage photography, realistic, ${prompt}, no text overlays, no watermarks, clean composition, cinematic lighting`
        );
        if (imageUrl) {
          const altText = caption || prompt;
          const figcaptionHtml = caption
            ? `<figcaption style="margin-top: 0.75em; font-size: 0.9em; color: #64748b; font-style: italic;">${caption}</figcaption>`
            : '';
          replacements.push({
            fullMatch: match[0],
            html: `<figure style="margin: 2em 0; text-align: center;"><img src="${imageUrl}" alt="${altText}" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" />${figcaptionHtml}</figure>`
          });
        } else {
          replacements.push({ fullMatch: match[0], html: '' });
        }
      } catch {
        replacements.push({ fullMatch: match[0], html: '' });
      }
    }

    for (const r of replacements) {
      content = content.replace(r.fullMatch, r.html);
    }

    return NextResponse.json({
      content,
      title: generated.title || topic,
      description: generated.short_description || '',
      meta_title: generated.meta_title || '',
      meta_description: generated.meta_description || '',
      key_points: Array.isArray(generated.key_points) ? generated.key_points : [],
      pros: Array.isArray(generated.pros) ? generated.pros : [],
      cons: Array.isArray(generated.cons) ? generated.cons : [],
      recommended_solutions: Array.isArray(generated.recommended_solutions) ? generated.recommended_solutions : []
    });
  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
