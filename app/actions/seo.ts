'use server';

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { analyzePage } from '@/lib/seo-analyzer';
import { revalidatePath } from 'next/cache';

export async function analyzeUrlAction(url: string) {
    // 1. Analyze the page
    // Ensure URL is absolute for fetching, but store relative path if it's internal
    const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${url}`;
    let path = fullUrl;
    try {
        path = new URL(fullUrl).pathname;
    } catch (e) {
        // If URL is invalid, just use it as is if it looks like a path
        path = url;
    }

    let result;
    try {
        result = await analyzePage(fullUrl);
    } catch (error) {
        console.error("Analysis failed:", error);
        return { success: false, error: "Failed to analyze page. Ensure the URL is accessible." };
    }

    // 2. Save Page Metrics using Admin client to bypass RLS if needed
    const { data: pageData, error: pageError } = await supabaseAdmin
        .from('seo_pages')
        .upsert({
            path: path,
            type: path.includes('/blog') || path.includes('/news') ? 'article' : 'page',
            title: result.title,
            meta_description: result.metaDescription,
            h1: result.h1,
            word_count: result.wordCount,
            seo_score: result.seoScore,
            aio_score: result.aioScore,
            last_crawled_at: new Date().toISOString(),
        }, { onConflict: 'path' })
        .select()
        .single();

    if (pageError || !pageData) {
        console.error("DB Error:", pageError);
        return { success: false, error: "Failed to save page metrics." };
    }

    // 3. Save Suggestions (Clear old ones first)
    await supabaseAdmin.from('seo_suggestions').delete().eq('page_id', pageData.id);

    if (result.suggestions.length > 0) {
        const { error: sugError } = await supabaseAdmin.from('seo_suggestions').insert(
            result.suggestions.map((s: any) => ({
                page_id: pageData.id,
                category: s.category,
                issue: s.issue,
                suggestion: s.suggestion,
                priority: s.priority,
                status: 'Open'
            }))
        );

        if (sugError) {
            console.error("Suggestion DB Error:", sugError);
        }
    }

    revalidatePath('/admin/seo');
    return { success: true, pageId: pageData.id };
}

export async function getSeoPages() {
    const { data, error } = await supabase
        .from('seo_pages')
        .select('*')
        .order('last_crawled_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getSeoPageDetails(id: string) {
    const { data: page, error: pageError } = await supabase
        .from('seo_pages')
        .select('*')
        .eq('id', id)
        .single();

    if (pageError) throw pageError;

    const { data: suggestions, error: sugError } = await supabase
        .from('seo_suggestions')
        .select('*')
        .eq('page_id', id);

    if (sugError) throw sugError;

    return { page, suggestions };
}
