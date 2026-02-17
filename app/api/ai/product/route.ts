import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateSmartContent } from '@/lib/ai/service';
import { generateProjectImage } from '@/lib/image-gen';

// Helper to get config
async function getAllConfig(): Promise<Record<string, string>> {
    const { data } = await supabaseAdmin.from('ai_config').select('*');
    const config: Record<string, string> = {};
    data?.forEach((row: any) => { config[row.key] = row.value; });
    return config;
}

type ContentGoal = 'catalog' | 'seo' | 'social' | 'technical';

const GOAL_PROMPTS: Record<ContentGoal, (context: any) => string> = {
    catalog: (ctx) => `
FOCUS: Professional Catalog Listing
- Highlight benefits and sales appeal.
- Focus on visibility, branding impact, and quality.
- Include a strong Call to Action.
- Tone: Professional & Persuasive.
`,
    seo: (ctx) => `
FOCUS: SEO Optimized Article
- Write a comprehensive, long-form description (min 300 words).
- Use HTML headings (h2, h3) to structure the content naturally.
- Focus on including relevant keywords naturally: ${ctx.keywords}.
- Detailed explanation of benefits, use cases, and installation/maintenance.
- Tone: Informative & Authoritative.
`,
    social: (ctx) => `
FOCUS: Social Media Post
- Write a short, engaging caption suitable for Instagram/Facebook.
- Use emojis significantly to make it visual 📸✨.
- Include relevant hashtags at the end (e.g. #Signage #${ctx.companyName}).
- Keep sentences punchy and exciting.
- Tone: ${ctx.tone || 'Exciting & Trending'}.
`,
    technical: (ctx) => `
FOCUS: Technical Datasheet / Spec Sheet
- Focus strictly on physical properties, grades, and durability.
- Use bullet points for clear data presentation.
- Avoid fluff or marketing buzzwords.
- Describe weather resistance, material composition, and finish details.
- Tone: Dry, Precise, Engineering-focused.
`
};

export async function POST(request: Request) {
    try {
        const { productName, features, audience, tone, language, type, goal = 'catalog' } = await request.json();

        if (!productName || !features) {
            return NextResponse.json({ error: 'Name and Features are required' }, { status: 400 });
        }

        const config = await getAllConfig();
        const companyName = config.company_name || 'SignsHaus';

        const langMap: Record<string, string> = {
            'en': 'English',
            'tl': 'Tagalog',
            'mix': 'Taglish (English + Tagalog mix)'
        };

        const isMaterial = type === 'material';
        const contextType = isMaterial ? 'Raw Material / Substrate' : 'Signage Product';
        const selectedGoal = (goal as ContentGoal) || 'catalog';

        const baseSystemPrompt = `You are an expert copywriter and technical specialist for ${companyName}, a premium signage manufacturer.
Your task is to write detailed content for a ${contextType}.

CONTEXT:
- Company: ${companyName}
- Item Type: ${contextType}
- Target Audience: ${audience || 'General Customers'}
- Tone: ${tone || 'Professional'}
- Language: ${langMap[language] || 'English'}
- Content Goal: ${selectedGoal.toUpperCase()}

${GOAL_PROMPTS[selectedGoal]({ companyName, keywords: features, tone })}

IMAGE PLACEHOLDER:
- Insert exactly 1 image placeholder in the long_description at a strategic point (unless the goal is Social Media, then NO image placeholder).
- Syntax: <!-- IMAGE: detailed english scene description for AI image generation | Short display caption -->
- Example: <!-- IMAGE: close-up of premium brushed stainless steel signage letter with LED backlight on dark wall | Premium Stainless Steel Channel Letters -->

CRITICAL FORMAT RULES:
- Output CLEAN HTML only. NO Markdown whatsoever.
- Use p tags for paragraphs, strong/em for emphasis.
- Use ul/li for feature lists.
- Do NOT use ## or ** or * or - for formatting.

OUTPUT FORMAT (JSON only):
{
  "title": "Professional Title",
  "short_description": "2-3 sentences summary.",
  "long_description": "Main content body in HTML. ${selectedGoal === 'social' ? 'Short text with emojis.' : 'Detailed HTML content.'}",
  "features_list": ["Feature 1", "Feature 2", "Feature 3"],
  "seo_keywords": ["keyword1", "keyword2", "keyword3"],
  "call_to_action": "Closing statement or CTA"
}`;

        const userPrompt = `Item Name: ${productName}
Key Specs/Notes: ${features}

Write content that achieves the goal: ${selectedGoal}.`;

        // Adjust validation settings based on goal
        const generationOptions = {
            temperature: selectedGoal === 'technical' ? 0.2 : (selectedGoal === 'social' ? 0.9 : 0.7)
        };

        const responseText = await generateSmartContent(baseSystemPrompt, userPrompt, undefined, generationOptions) || "";

        // Clean markdown if AI adds it
        const content = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        if (!content) throw new Error('Failed to generate content');

        const result = JSON.parse(content);

        // Process IMAGE placeholders in long_description
        if (result.long_description && selectedGoal !== 'social') {
            const imagePlaceholderRegex = /<!-- IMAGE: (.+?) -->/g;
            let match;
            while ((match = imagePlaceholderRegex.exec(result.long_description)) !== null) {
                const raw = match[1];
                const parts = raw.split('|').map((s: string) => s.trim());
                const prompt = parts[0];
                const caption = parts[1] || '';
                try {
                    const imageUrl = await generateProjectImage(
                        `professional signage photography, realistic, ${prompt}, no text overlays, no watermarks, clean composition, studio lighting`
                    );
                    if (imageUrl) {
                        const altText = caption || prompt;
                        const figcaptionHtml = caption
                            ? `<figcaption style="margin-top: 0.5em; font-size: 0.85em; color: #64748b; font-style: italic;">${caption}</figcaption>`
                            : '';
                        result.long_description = result.long_description.replace(
                            match[0],
                            `<figure style="margin: 1.5em 0; text-align: center;"><img src="${imageUrl}" alt="${altText}" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" />${figcaptionHtml}</figure>`
                        );
                    } else {
                        result.long_description = result.long_description.replace(match[0], '');
                    }
                } catch {
                    result.long_description = result.long_description.replace(match[0], '');
                }
            }
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Writer Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
