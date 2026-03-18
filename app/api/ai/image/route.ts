import { NextResponse } from 'next/server';
import { generateProjectImage } from '@/lib/image-gen';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const enhancedPrompt = `Realistic, high-quality, professional photography of a signage project: ${prompt}. Location: Modern urban business district. Clear, crisp, no text distortions. Natural lighting.`;

    const imageUrl = await generateProjectImage(enhancedPrompt, {
      contentType: 'project',
      keyword: prompt,
      preferLibrary: true,
      enableRealismRetry: true
    });

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error('Image Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
