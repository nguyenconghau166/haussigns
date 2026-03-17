import { NextResponse } from 'next/server';
import { generateSmartContent } from '@/lib/ai/service';
import { saveQAHistory, scoreContent } from '@/lib/content-qa';

function parseJsonFromModel<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  const candidate = objectMatch ? objectMatch[0] : cleaned;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    return fallback;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      content,
      metaTitle,
      metaDescription,
      contentType,
      suggestions,
      aiBrief,
      entityId,
      entityTable
    } = body;

    if (!title || !content || !contentType) {
      return NextResponse.json({ error: 'title, content, contentType are required' }, { status: 400 });
    }

    const systemPrompt = `You are a senior editor for commercial signage content.
Rewrite draft content to improve clarity, structure, SEO quality, and trust.

Rules:
- Preserve factual meaning and core offer.
- Keep HTML output (h2/h3/p/ul/li/table) without markdown.
- Improve scannability and practical decision support.
- Avoid unsupported claims and exaggerated guarantees.

Audience brief:
- Intent: ${aiBrief?.intent || 'commercial'}
- Persona: ${aiBrief?.persona || 'Business owner / purchasing manager'}
- Funnel stage: ${aiBrief?.funnelStage || 'consideration'}
- Tone: ${aiBrief?.tone || 'Professional and practical'}
- Must include: ${aiBrief?.mustInclude || 'N/A'}
- Avoid claims: ${aiBrief?.avoidClaims || 'No unsupported superlatives'}
- Entity focus: ${aiBrief?.entityFocus || 'N/A'}

Return JSON only:
{
  "title": "...",
  "description": "...",
  "content": "<h2>...</h2><p>...</p>",
  "meta_title": "...",
  "meta_description": "..."
}`;

    const userPrompt = `Content type: ${contentType}
Title: ${title}
Description: ${description || ''}
Meta title: ${metaTitle || ''}
Meta description: ${metaDescription || ''}

Suggestions to address:
${Array.isArray(suggestions) ? suggestions.map((s: string) => `- ${s}`).join('\n') : '- Improve overall quality'}

Current HTML:
${content}`;

    const raw = await generateSmartContent(systemPrompt, userPrompt);
    const fixed = parseJsonFromModel<{
      title?: string;
      description?: string;
      content?: string;
      meta_title?: string;
      meta_description?: string;
    }>(raw, {});

    const output = {
      title: fixed.title || title,
      description: fixed.description || description || '',
      content: fixed.content || content,
      meta_title: fixed.meta_title || metaTitle || '',
      meta_description: fixed.meta_description || metaDescription || ''
    };

    const qa = scoreContent({
      title: output.title,
      description: output.description,
      content: output.content,
      metaTitle: output.meta_title,
      metaDescription: output.meta_description,
      contentType: contentType as 'material' | 'industry' | 'project' | 'page' | 'product',
      entityId,
      entityTable
    });

    await saveQAHistory({
      title: output.title,
      description: output.description,
      content: output.content,
      metaTitle: output.meta_title,
      metaDescription: output.meta_description,
      contentType: contentType as 'material' | 'industry' | 'project' | 'page' | 'product',
      entityId,
      entityTable
    }, qa, 'autofix');

    return NextResponse.json({ ...output, qa });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to auto-fix draft' }, { status: 500 });
  }
}
