import { NextResponse } from 'next/server';
import { generateSmartContent } from '@/lib/ai/service';
import { generateProjectImage } from '@/lib/image-gen';

export async function POST(request: Request) {
  try {
    const { topic, lang, tone, slug, pageContext } = await request.json();

    let systemPrompt = `You are an expert Signage Contractor in Metro Manila, Philippines. 
    You have 20 years of experience in fabrication (Acrylic, Stainless, Panaflex).
    Your goal is to write high-ranking SEO content that is helpful, technical, but easy to understand.
    Target Audience: Business owners (SME), Corporate Purchasing Heads, Store Managers in Manila.
    Language: ${lang === 'tl' ? 'Tagalog' : lang === 'mix' ? 'Taglish (English-Tagalog Mix)' : 'English'}.
    Tone: ${tone}.`;

    // Tailor prompt based on page type
    if (slug === 'about') {
      systemPrompt += `
      CONTEXT: You are writing the "About Us" page for SignsHaus.
      Structure:
      - Introduction: Brief history and mission (Established in [Year], trusted by big brands).
      - Our Values: Quality, Speed, Reliability.
      - Why Choose Us: In-house fabrication, skilled team, warranty.
      - Call to Action: Invite them to visit the workshop or contact for a quote.
      - Tone: Trustworthy, Experienced, Professional.
      `;
    } else if (slug === 'services') {
      systemPrompt += `
      CONTEXT: You are writing the main "Our Services" page.
      Structure:
      - Introduction: Overview of our fabrication capabilities.
      - Key Services (Bullet points or short paragraphs): Acrylic Build-up, Stainless Steel, Lightboxes, Panaflex, Vehicle Wraps, etc.
      - Process: Design -> Fabrication -> Installation.
      - Quality Assurance: We use high-quality LEDs and materials.
      - Call to Action.
      `;
    } else if (slug === 'contact') {
      systemPrompt += `
      CONTEXT: You are writing the "Contact Us" page intro.
      Structure:
      - Warm, welcoming invitation to reach out.
      - Mention we cover all of Metro Manila and nearby provinces.
      - Encourage requesting a Free Ocular Inspection / Quote.
      - Mention response time (usually within 24 hours).
      - Keep it short and inviting (2-3 paragraphs max).
      `;
    } else if (slug === 'portfolio') {
      systemPrompt += `
       CONTEXT: You are writing the intro for the "Our Portfolio" page.
       Structure:
       - Proud statement about our past works.
       - Mention we serve various industries (Restaurants, Corporate, Retail, Malls).
       - Mention quality of finish and attention to detail.
       - Encourage users to browse the gallery below.
       - Keep it short (1-2 paragraphs).
       `;
    } else {
      // Default / Generic Page / Blog Post
      systemPrompt += `
      Structure:
      - Engaging Introduction (Hook)
      - Technical Details (Materials, Process)
      - Benefits
      - Price Range Estimate (in PHP) if applicable
      - FAQ Section
      - Strong Call to Action (Contact SignsHaus).
      `;
    }

    systemPrompt += `
    IMAGE PLACEHOLDERS:
    - Insert exactly 2-3 image placeholders at strategic points (unless it's a short page like Contact/Portfolio, then 0-1).
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
