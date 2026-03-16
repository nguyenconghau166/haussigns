'use server';

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { analyzePage } from '@/lib/seo-analyzer';
import { revalidatePath } from 'next/cache';
import generateSitemap from '@/app/sitemap';

interface SeaSuggestion {
    category: string;
    issue: string;
    suggestion: string;
    priority: string;
}

interface AnalyzeTarget {
    fetchUrl: string;
    storePath: string;
    type: 'article' | 'page';
}

function isMissingTableError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const maybe = error as { code?: string; message?: string };
    return maybe.code === '42P01' || (maybe.message || '').toLowerCase().includes('relation') && (maybe.message || '').toLowerCase().includes('seo_');
}

function getSiteOrigin(): string {
    const fallback = 'http://localhost:3000';
    const raw = process.env.NEXT_PUBLIC_SITE_URL || fallback;

    try {
        return new URL(raw).origin;
    } catch {
        return fallback;
    }
}

function classifyPageType(pathname: string): 'article' | 'page' {
    const normalized = pathname.toLowerCase();
    return normalized.includes('/blog') || normalized.includes('/news') || normalized.includes('/post')
        ? 'article'
        : 'page';
}

function normalizeAnalyzeTarget(rawInput: string): AnalyzeTarget {
    const input = rawInput.trim();
    if (!input) {
        throw new Error('URL/path is required');
    }

    const siteOrigin = getSiteOrigin();
    const siteHost = new URL(siteOrigin).host;

    if (input.startsWith('http://') || input.startsWith('https://')) {
        const parsed = new URL(input);
        const isInternalHost = parsed.host === siteHost;
        const pathAndQuery = `${parsed.pathname}${parsed.search}`;

        return {
            fetchUrl: `${parsed.origin}${pathAndQuery}`,
            storePath: isInternalHost ? pathAndQuery || '/' : `${parsed.origin}${pathAndQuery}`,
            type: classifyPageType(parsed.pathname),
        };
    }

    const normalizedPath = input.startsWith('/') ? input : `/${input}`;
    const url = new URL(normalizedPath, siteOrigin);

    return {
        fetchUrl: url.toString(),
        storePath: `${url.pathname}${url.search}` || '/',
        type: classifyPageType(url.pathname),
    };
}

function sanitizeSuggestion(raw: SeaSuggestion) {
    const category = ['Technical', 'Content', 'AIO', 'Schema'].includes(raw.category)
        ? raw.category
        : 'AIO';
    const priority = ['High', 'Medium', 'Low'].includes(raw.priority)
        ? raw.priority
        : 'Medium';

    return {
        category,
        issue: (raw.issue || '').trim() || 'Optimization opportunity',
        suggestion: (raw.suggestion || '').trim() || 'Review this page and improve SEO/AIO quality.',
        priority,
    };
}

async function saveAnalysis(target: AnalyzeTarget, result: Awaited<ReturnType<typeof analyzePage>>) {
    const { data: pageData, error: pageError } = await supabaseAdmin
        .from('seo_pages')
        .upsert({
            path: target.storePath,
            type: target.type,
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
        return { success: false as const, error: pageError, pageId: null };
    }

    await supabaseAdmin.from('seo_suggestions').delete().eq('page_id', pageData.id);

    if (result.suggestions.length > 0) {
        const sanitizedSuggestions = result.suggestions.map((s: SeaSuggestion) => sanitizeSuggestion(s));
        const { error: sugError } = await supabaseAdmin.from('seo_suggestions').insert(
            sanitizedSuggestions.map((s) => ({
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

    return { success: true as const, error: null, pageId: pageData.id };
}

export async function analyzeUrlAction(url: string) {
    let target;
    try {
        target = normalizeAnalyzeTarget(url);
    } catch {
        return { success: false, error: 'Invalid URL/path. Try /about or https://example.com/page.' };
    }

    let result;
    try {
        result = await analyzePage(target.fetchUrl);
    } catch (error) {
        console.error("Analysis failed:", error);
        return { success: false, error: "Failed to analyze page. Ensure the URL is accessible." };
    }

    const persisted = await saveAnalysis(target, result);
    if (!persisted.success) {
        console.error("DB Error:", persisted.error);
        if (isMissingTableError(persisted.error)) {
            return { success: false, error: 'SEO tables are missing. Please run migration v15 first.' };
        }
        return { success: false, error: "Failed to save page metrics." };
    }

    revalidatePath('/admin/seo');
    return { success: true, pageId: persisted.pageId };
}

export async function bulkAnalyzeFromSitemapAction(limit = 25) {
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit || 25)));

    let sitemapEntries;
    try {
        sitemapEntries = await generateSitemap();
    } catch (error) {
        console.error('Failed to load sitemap entries:', error);
        return { success: false, error: 'Could not load sitemap entries.' };
    }

    const uniqueUrls = Array.from(new Set(
        sitemapEntries
            .map((entry) => (entry.url || '').toString().trim())
            .filter(Boolean)
    ));

    const normalizedTargets = uniqueUrls
        .map((url) => {
            try {
                return normalizeAnalyzeTarget(url);
            } catch {
                return null;
            }
        })
        .filter((item): item is AnalyzeTarget => item !== null);

    const { data: existingRows, error: existingError } = await supabaseAdmin
        .from('seo_pages')
        .select('path');

    if (existingError) {
        console.error('Failed to load existing SEO pages:', existingError);
        if (isMissingTableError(existingError)) {
            return { success: false, error: 'SEO tables are missing. Please run migration v15 first.' };
        }
        return { success: false, error: 'Failed to read existing SEO records.' };
    }

    const existingPaths = new Set((existingRows || []).map((row) => row.path));
    const newTargets = normalizedTargets.filter((target) => !existingPaths.has(target.storePath));
    const targetsToAnalyze = newTargets.slice(0, safeLimit);

    let analyzed = 0;
    let failed = 0;
    const failures: string[] = [];

    for (const target of targetsToAnalyze) {
        try {
            const result = await analyzePage(target.fetchUrl);
            const persisted = await saveAnalysis(target, result);
            if (!persisted.success) {
                failed += 1;
                failures.push(`${target.storePath}: DB save failed`);
                continue;
            }
            analyzed += 1;
        } catch (error) {
            failed += 1;
            const message = error instanceof Error ? error.message : 'Unknown error';
            failures.push(`${target.storePath}: ${message}`);
        }
    }

    revalidatePath('/admin/seo');

    return {
        success: true,
        scanned: normalizedTargets.length,
        existing: normalizedTargets.length - newTargets.length,
        queued: targetsToAnalyze.length,
        analyzed,
        failed,
        failures: failures.slice(0, 8),
    };
}

export async function rescanOutdatedPagesAction(days = 7, limit = 20) {
    const safeDays = Math.max(1, Math.min(365, Math.floor(days || 7)));
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit || 20)));
    const cutoffTime = Date.now() - safeDays * 24 * 60 * 60 * 1000;

    const { data: trackedRows, error: trackedError } = await supabaseAdmin
        .from('seo_pages')
        .select('path, last_crawled_at')
        .order('last_crawled_at', { ascending: true, nullsFirst: true })
        .limit(5000);

    if (trackedError) {
        console.error('Failed to load tracked SEO pages:', trackedError);
        if (isMissingTableError(trackedError)) {
            return { success: false, error: 'SEO tables are missing. Please run migration v15 first.' };
        }
        return { success: false, error: 'Failed to read tracked SEO pages.' };
    }

    const staleRows = (trackedRows || []).filter((row) => {
        if (!row.last_crawled_at) return true;
        const crawledAt = new Date(row.last_crawled_at).getTime();
        if (Number.isNaN(crawledAt)) return true;
        return crawledAt < cutoffTime;
    });

    const targetsToAnalyze = staleRows
        .map((row) => {
            try {
                return normalizeAnalyzeTarget(row.path);
            } catch {
                return null;
            }
        })
        .filter((item): item is AnalyzeTarget => item !== null)
        .slice(0, safeLimit);

    let reanalyzed = 0;
    let failed = 0;
    const failures: string[] = [];

    for (const target of targetsToAnalyze) {
        try {
            const result = await analyzePage(target.fetchUrl);
            const persisted = await saveAnalysis(target, result);
            if (!persisted.success) {
                failed += 1;
                failures.push(`${target.storePath}: DB save failed`);
                continue;
            }
            reanalyzed += 1;
        } catch (error) {
            failed += 1;
            const message = error instanceof Error ? error.message : 'Unknown error';
            failures.push(`${target.storePath}: ${message}`);
        }
    }

    revalidatePath('/admin/seo');

    return {
        success: true,
        tracked: (trackedRows || []).length,
        stale: staleRows.length,
        queued: targetsToAnalyze.length,
        reanalyzed,
        failed,
        failures: failures.slice(0, 8),
    };
}

export async function getSeoPages() {
    const { data, error } = await supabase
        .from('seo_pages')
        .select('*')
        .order('last_crawled_at', { ascending: false });

    if (error) {
        if (isMissingTableError(error)) {
            throw new Error('SEO tables are missing. Run migration v15 to initialize seo_pages and seo_suggestions.');
        }
        throw error;
    }
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
