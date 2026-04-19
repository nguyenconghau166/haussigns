import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { generateProjectImage } from '@/lib/image-gen';
import { buildPhotorealisticPrompt, buildSeoAltText } from '@/lib/pipeline/utils';

export const maxDuration = 300;

function buildFigure(imageUrl: string, keyword: string, caption: string): string {
  const altText = buildSeoAltText(keyword, caption);
  return `<figure class="article-image"><img src="${imageUrl}" alt="${altText}" loading="lazy" decoding="async" class="article-image" /><figcaption>${caption}</figcaption></figure>`;
}

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const { data: post, error: loadErr } = await supabaseAdmin
    .from('posts').select('id, slug, title, content, tags').eq('id', id).single();

  if (loadErr || !post) {
    return NextResponse.json({ error: loadErr?.message || 'Post not found' }, { status: 404 });
  }

  const keyword = (Array.isArray(post.tags) && post.tags[0]) || post.title;
  let content: string = post.content || '';

  const existingFigures = (content.match(/<figure[^>]*class="article-image"/gi) || []).length;
  const TARGET = 3;
  if (existingFigures >= TARGET) {
    return NextResponse.json({ skipped: true, reason: `Already has ${existingFigures} inline figures` });
  }
  const needed = TARGET - existingFigures;

  const sceneVariations = [
    'Filipino signage technicians fabricating channel letters in a Valenzuela workshop, CNC router and welded stainless steel visible, natural workshop lighting',
    'installation team on scaffolding mounting illuminated signage on a commercial storefront in Metro Manila, mid-afternoon light, street context visible',
    'close-up of acrylic and LED module assembly on a workbench, hands working with precision tools, shallow depth of field',
  ];
  const captionHints = ['workshop fabrication', 'on-site installation', 'material close-up'];

  const failures: string[] = [];
  let inserted = 0;

  for (let i = 0; i < needed; i++) {
    const scene = sceneVariations[i % sceneVariations.length];
    const caption = `${keyword} — ${captionHints[i % captionHints.length]}`;
    try {
      const prompt = buildPhotorealisticPrompt(scene, '');
      const imageUrl = await generateProjectImage(prompt, {
        contentType: 'post', keyword, preferLibrary: false, enableRealismRetry: false,
      });
      if (!imageUrl) { failures.push(`null for ${caption}`); continue; }

      const figureHtml = buildFigure(imageUrl, keyword, caption);
      // Insert after first </p> past position 1500 that isn't already followed by a figure
      const offset = 1500 + (i * 200);
      const m = /<\/p>(?!\s*<figure)/.exec(content.slice(offset));
      if (m) {
        const absPos = offset + m.index + m[0].length;
        content = content.slice(0, absPos) + '\n' + figureHtml + '\n' + content.slice(absPos);
        inserted++;
      } else {
        content += '\n' + figureHtml;
        inserted++;
      }
    } catch (e) {
      failures.push(e instanceof Error ? e.message : String(e));
    }
  }

  if (inserted === 0) {
    return NextResponse.json({ inserted: 0, failures }, { status: 500 });
  }

  const { error: updateErr } = await supabaseAdmin
    .from('posts').update({ content, updated_at: new Date().toISOString() }).eq('id', id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message, inserted }, { status: 500 });
  }

  if (post.slug) {
    revalidatePath('/blog');
    revalidatePath(`/blog/${post.slug}`);
  }

  return NextResponse.json({ inserted, failures, existing_figures: existingFigures });
}
