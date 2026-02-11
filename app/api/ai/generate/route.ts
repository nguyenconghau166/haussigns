import { NextResponse } from 'next/server';
import { generateSmartContent } from '@/lib/ai/service';

export async function POST(request: Request) {
  try {
    const { topic, lang, tone } = await request.json();

    const systemPrompt = `You are an expert Signage Contractor in Metro Manila, Philippines. 
    You have 20 years of experience in fabrication (Acrylic, Stainless, Panaflex).
    Your goal is to write high-ranking SEO content that is helpful, technical, but easy to understand.
    Target Audience: Business owners (SME), Corporate Purchasing Heads, Store Managers in Manila.
    Language: ${lang === 'tl' ? 'Tagalog' : lang === 'mix' ? 'Taglish (English-Tagalog Mix)' : 'English'}.
    Tone: ${tone}.
    Structure:
    - Catchy Title (H1)
    - Engaging Introduction (Hook)
    - Technical Details (Materials, Process)
    - Benefits
    - Price Range Estimate (in PHP)
    - FAQ Section
    - Strong Call to Action (Contact SignsHaus).
    Format: Markdown.`;

    const userPrompt = `Write a comprehensive article about: "${topic}". Focus on durability, price, and visual appeal. Mention locations like Makati, BGC, Quezon City naturally.`;

    const content = await generateSmartContent(systemPrompt, userPrompt);

    return NextResponse.json({ content });
  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
