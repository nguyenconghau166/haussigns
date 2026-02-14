import { NextResponse } from 'next/server';
import { generateSmartContent } from '@/lib/ai/service';
import { generateProjectImage } from '@/lib/image-gen';

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
    - Engaging Introduction (Hook)
    - Technical Details (Materials, Process)
    - Benefits
    - Price Range Estimate (in PHP)
    - FAQ Section
    - Strong Call to Action (Contact SignsHaus).
    
    IMAGE PLACEHOLDERS:
    - Insert exactly 2-3 image placeholders at strategic points in the article
    - Syntax: <!-- IMAGE: detailed english scene description for AI image generation | Short display caption -->
    - Example: <!-- IMAGE: professional acrylic LED signage installed on modern office building facade in Makati at night, warm lighting | Acrylic LED Signage on a Commercial Building -->
    - IMPORTANT: The part before | must be a DETAILED, SPECIFIC scene description related to the paragraph above (type of sign, material, specific setting). The part after | is a SHORT reader-friendly caption.
    - Place them after paragraphs describing visuals, materials or processes
    
    CRITICAL FORMAT RULES:
    - Output CLEAN HTML only. NO Markdown whatsoever.
    - Use h2 and h3 tags for section headings (NOT ## or ###)
    - Use p tags for paragraphs (NOT plain text)
    - Use ul/li or ol/li for lists (NOT - or *)
    - Use strong and em for emphasis (NOT ** or *)
    - Use blockquote for quotes (NOT >)
    - Use table/thead/tbody/tr/th/td for price tables
    - Write naturally like a published newspaper article, NOT a dry list`;

    const userPrompt = `Write a comprehensive article about: "${topic}". Focus on durability, price, and visual appeal. Mention locations like Makati, BGC, Quezon City naturally.`;

    let content = await generateSmartContent(systemPrompt, userPrompt) || '';

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

    return NextResponse.json({ content });
  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
