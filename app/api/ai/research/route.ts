import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const { seed } = await request.json();

    const systemPrompt = `You are an SEO Strategist for a Signage Company in Metro Manila.
    Your goal is to generate high-intent keywords related to the seed keyword.
    Focus on:
    - Transactional keywords (e.g., "signage maker price")
    - Localized keywords (e.g., "acrylic signs makati")
    - Long-tail questions (e.g., "how much for stainless logo")
    
    Output JSON format only:
    [
      { "keyword": "...", "volume": 100, "difficulty": 10, "intent": "transactional" }
    ]
    Estimate volume (monthly searches) and difficulty (0-100) based on your knowledge base.`;

    const userPrompt = `Generate 10 keywords for: "${seed}"`;

    const content = await generateContent(systemPrompt, userPrompt);
    
    // Parse JSON from content (handle potential markdown ticks)
    let jsonStr = content?.replace(/```json/g, '').replace(/```/g, '').trim() || '[]';
    const keywords = JSON.parse(jsonStr);

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error('AI Research Error:', error);
    return NextResponse.json({ error: 'Failed to research keywords' }, { status: 500 });
  }
}
