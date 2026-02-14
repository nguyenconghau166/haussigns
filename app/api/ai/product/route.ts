import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateSmartContent } from '@/lib/ai/service';
import { generateProjectImage } from '@/lib/image-gen';

// Helper to get config
async function getAllConfig(): Promise<Record<string, string>> {
    // ... existing config fetching ...
    const { data } = await supabaseAdmin.from('ai_config').select('*');
    const config: Record<string, string> = {};
    data?.forEach((row: any) => { config[row.key] = row.value; });
    return config;
}

export async function POST(request: Request) {
    try {
        const { productName, features, audience, tone, language, type } = await request.json();

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

        const systemPrompt = `You are an expert copywriter and technical specialist for ${companyName}, a premium signage manufacturer.
Your task is to write a detailed description for a ${contextType}.

CONTEXT:
- Company: ${companyName}
- Item Type: ${contextType}
- Target Audience: ${audience || 'General Customers'}
- Tone: ${tone || 'Professional'}
- Language: ${langMap[language] || 'English'}

${isMaterial ? `
FOCUS FOR MATERIALS:
- Highlight technical properties (Durability, Weather Resistance, Thickness options).
- Describe the finish and aesthetic quality (Matte, Glossy, Brushed, etc.).
- Mention common applications (Best for indoor/outdoor, specific sign types).
- Maintain a technical but accessible tone.
` : `
FOCUS FOR PRODUCTS:
- Highlight benefits and sales appeal.
- Focus on visibility, branding impact, and quality.
- Include a strong Call to Action.
`}

IMAGE PLACEHOLDER:
- Insert exactly 1 image placeholder in the long_description at a strategic point
- Use this syntax: <!-- IMAGE: detailed english description for AI image generation -->
- Example: <!-- IMAGE: close-up of premium brushed stainless steel signage letter with LED backlight -->

CRITICAL FORMAT RULES FOR long_description:
- Output CLEAN HTML only. NO Markdown whatsoever.
- Use p tags for paragraphs, strong/em for emphasis
- Use ul/li for feature lists within the description
- Write naturally like a published product catalog, NOT a dry spec sheet
- Do NOT use ## or ** or * or - for formatting

OUTPUT FORMAT (JSON only):
{
  "title": "Professional Title (e.g., 'Premium 304 Stainless Steel' or '3D Acrylic Build-up')",
  "short_description": "2-3 sentences summary suitable for a catalog listing.",
  "long_description": "Detailed description in clean HTML (2-3 paragraphs using p, strong, ul/li tags). ${isMaterial ? 'Focus on material properties, grades, and suitability.' : 'Focus on marketing benefits.'} Include 1 IMAGE placeholder.",
  "features_list": ["${isMaterial ? 'Technical Spec 1' : 'Benefit 1'}", "${isMaterial ? 'Technical Spec 2' : 'Benefit 2'}", "Feature 3"],
  "seo_keywords": ["keyword1", "keyword2", "keyword3"],
  "call_to_action": "${isMaterial ? 'Suggestion for use (e.g., Perfect for your next lobby sign)' : 'Sales Call to Action'}"
}`;

        const userPrompt = `Item Name: ${productName}
Key Specs/Notes: ${features}

Write a description that positions this ${isMaterial ? 'material as a premium choice for signage' : 'product as a must-have for business branding'}.`;

        const responseText = await generateSmartContent(systemPrompt, userPrompt) || "";

        // Clean markdown if AI adds it (Gemini often does)
        const content = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        if (!content) throw new Error('Failed to generate content');

        const result = JSON.parse(content);

        // Process IMAGE placeholders in long_description
        if (result.long_description) {
            const imagePlaceholderRegex = /<!-- IMAGE: (.+?) -->/g;
            let match;
            while ((match = imagePlaceholderRegex.exec(result.long_description)) !== null) {
                try {
                    const imageUrl = await generateProjectImage(
                        `professional photography, ${match[1]}, no text overlays, clean composition, studio lighting`
                    );
                    if (imageUrl) {
                        result.long_description = result.long_description.replace(
                            match[0],
                            `<figure style="margin: 1.5em 0; text-align: center;"><img src="${imageUrl}" alt="${match[1]}" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" /><figcaption style="margin-top: 0.5em; font-size: 0.85em; color: #64748b; font-style: italic;">${match[1]}</figcaption></figure>`
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
