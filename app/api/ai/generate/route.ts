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
      PAGE TYPE: Industry service page (GEO/AIO optimized).
      STRUCTURE:
      1) Answer-first intro: Start with a direct 1-2 sentence answer about signage for this industry.
      2) Industry pain points and buying criteria (with specific Metro Manila context).
      3) Recommended signage formats (3-5 items with brief explanation each).
      4) Compliance/maintenance considerations specific to this industry.
      5) FAQ section: Include 3-5 questions ending with "?" as H3 headings, each followed by a concise paragraph answer. Questions should match what business owners actually search.
      6) Clear CTA for consultation/ocular inspection.
      Return 4-6 recommended_solutions.
      Each H2 section must start with a direct answer before elaborating.
      `,
      material: `
      PAGE TYPE: Material specification page (GEO/AIO optimized).
      STRUCTURE:
      1) Answer-first intro: "What is [material]?" answered in 1-2 sentences immediately.
      2) Key properties: durability, weather resistance, indoor/outdoor suitability.
      3) Real-world applications with Metro Manila examples (malls, storefronts, offices).
      4) Balanced pros and cons (minimum 3 each).
      5) FAQ section: Include 3-5 questions as H3 headings ending with "?", each with concise answer. Focus on cost, lifespan, maintenance, comparison with alternatives.
      6) Best use cases by business type.
      Return pros and cons arrays.
      Each H2 section must lead with the key fact before details.
      `,
      project: `
      PAGE TYPE: Project case study (E-E-A-T optimized).
      STRUCTURE:
      1) Project summary: client, location, challenge, solution in 2-3 sentences.
      2) Client context + specific constraints (budget, timeline, environment).
      3) Solution details: materials used, fabrication process, installation approach.
      4) Results and impact: measurable outcomes where possible.
      5) Key takeaways: 3-4 bullet points of lessons learned.
      6) CTA for similar projects.
      Include specific locations (Makati, BGC, QC) where relevant.
      `,
      page: `
      PAGE TYPE: Core service/business page (GEO/AIO optimized).
      STRUCTURE:
      1) Clear value proposition in first paragraph — answer "why choose this service?".
      2) Service process and differentiators (with specific details, not generic).
      3) Trust signals: years of experience, materials used, areas served.
      4) FAQ section: 3-5 practical questions as H3 headings with "?", concise answers.
      5) Strong intent-matching CTA.
      Every section should be self-contained for AI passage extraction.
      `,
      post: `
      PAGE TYPE: Informational post.
      Must include hook, deep explanation, examples, and practical close.
      Include FAQ section with 3-5 Q&A pairs as H3 headings.
      `,
      generic: `
      PAGE TYPE: Commercial informational page.
      Must include practical guidance, transparent tradeoffs, and CTA.
      Include 2-3 FAQ questions as H3 headings where relevant.
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
          `real signage installation photo, ${prompt}, natural lighting, true-to-life colors, documentary composition, no text overlays, no watermarks`,
          {
            contentType: normalizedType,
            keyword: topic || pageContext || slug,
            preferLibrary: true,
            enableRealismRetry: true
          }
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
