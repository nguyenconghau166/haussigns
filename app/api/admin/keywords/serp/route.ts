import { NextResponse } from 'next/server';
import { generateSmartContent } from '@/lib/ai/service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const keyword = String(body?.keyword || '').trim();

    if (!keyword) {
      return NextResponse.json({ error: 'Missing keyword' }, { status: 400 });
    }

    const systemPrompt = `You are an SEO analyst specializing in local business search in the Philippines.
Analyze the search landscape for a given keyword from the perspective of a signage/sign-making business.

Return JSON only (no markdown). Schema:
{
  "people_also_ask": ["question 1", "question 2", "question 3", "question 4", "question 5"],
  "serp_features": ["Featured snippet", "Local pack", "Image pack"],
  "content_angles": [
    { "angle": "Short title", "description": "Why this angle works", "content_type": "blog/guide/landing page" }
  ],
  "competitor_themes": ["theme 1", "theme 2", "theme 3"],
  "content_recommendation": "1-2 sentence recommendation for the best content to create"
}`;

    const userPrompt = `Analyze SERP landscape for: "${keyword}" in the Philippines market. Focus on opportunities for a signage business.`;

    const content = await generateSmartContent(systemPrompt, userPrompt);

    const cleaned = content
      ?.replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim() || '{}';

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    if (!parsed) {
      return NextResponse.json({ error: 'Could not analyze SERP' }, { status: 502 });
    }

    return NextResponse.json({ keyword, analysis: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
