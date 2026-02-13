
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase';

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 60; // Allow longer timeout for generation & upload

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // 1. Generate Image with DALL-E 3
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            response_format: "b64_json", // Get base64 directly to avoid double downloading
        });

        const b64Json = response.data[0].b64_json;
        if (!b64Json) {
            throw new Error("Failed to generate image data");
        }

        // 2. Upload to Supabase Storage
        const buffer = Buffer.from(b64Json, 'base64');
        const fileName = `generated-${Date.now()}.png`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('images')
            .upload(fileName, buffer, {
                contentType: 'image/png',
                upsert: false
            });

        if (uploadError) {
            console.error('Upload generated image error:', uploadError);
            return NextResponse.json({ error: 'Failed to save generated image' }, { status: 500 });
        }

        // 3. Get Public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('images')
            .getPublicUrl(fileName);

        return NextResponse.json({ url: publicUrl });

    } catch (error: any) {
        console.error('Generation error:', error);
        return NextResponse.json({ error: error.message || 'Image generation failed' }, { status: 500 });
    }
}
