import { supabaseAdmin } from './supabase';
import { extractKeywordsForLinking } from './ai-agents';

// Types
export interface LinkingRule {
    id: string;
    keyword: string;
    target_url: string;
    target_type: string;
    target_id: string;
    priority: number;
}

export interface ScanResult {
    mapped: number;
    errors: string[];
}

export interface InjectResult {
    processed: number;
    updated: number;
    errors: string[];
}

// 1. SCAN: Analyze content and generate linking rules
export async function scanAndGenerateRules(): Promise<ScanResult> {
    const errors: string[] = [];
    let mappedCount = 0;

    try {
        // A. Fetch all potential link targets (Products, Services/Projects, Posts)
        const [products, projects, posts] = await Promise.all([
            supabaseAdmin.from('products').select('id, name, description, content, slug').eq('is_published', true),
            supabaseAdmin.from('projects').select('id, title, description, content, slug'),
            supabaseAdmin.from('posts').select('id, title, excerpt, content, slug').eq('status', 'published')
        ]);

        // Standardize items to a common interface
        interface LinkableItem {
            id: string;
            type: 'product' | 'project' | 'post';
            title: string;
            description: string;
            content: string;
            slug: string;
        }

        const allItems: LinkableItem[] = [
            ...(products.data || []).map(i => ({
                id: i.id,
                type: 'product' as const,
                title: i.name,
                description: i.description || '',
                content: i.content || '',
                slug: i.slug
            })),
            ...(projects.data || []).map(i => ({
                id: i.id,
                type: 'project' as const,
                title: i.title,
                description: i.description || '',
                content: i.content || '',
                slug: i.slug
            })),
            ...(posts.data || []).map(i => ({
                id: i.id,
                type: 'post' as const,
                title: i.title,
                description: i.excerpt || '',
                content: i.content || '',
                slug: i.slug
            }))
        ];

        console.log(`Scanning ${allItems.length} items for keywords...`);

        // B. For each item, generate rules if needed
        for (const item of allItems) {
            if (!item.slug) continue;

            // Check existing rules
            const existing = await supabaseAdmin
                .from('internal_linking_rules')
                .select('id')
                .eq('target_id', item.id);

            if (existing.data && existing.data.length > 0) {
                continue; // Skip if exists
            }

            // Generate Keywords via AI
            const textContent = (item.description || '') + ' ' + (item.content || '');
            const keywords = await extractKeywordsForLinking(item.title, item.description || '', textContent);

            if (keywords.length > 0) {
                // Prepare rows
                const targetUrl = `/${item.type === 'post' ? 'news' : item.type === 'project' ? 'projects' : 'products'}/${item.slug}`;

                const rows = keywords.map(kw => ({
                    keyword: kw.toLowerCase().trim(),
                    target_url: targetUrl,
                    target_type: item.type,
                    target_id: item.id,
                    priority: 1
                }));

                const { error } = await supabaseAdmin.from('internal_linking_rules').insert(rows);
                if (error) {
                    errors.push(`Failed to save rules for ${item.title}: ${error.message}`);
                } else {
                    mappedCount++;
                }
            }
        }

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown scan error';
        errors.push(msg);
    }

    return { mapped: mappedCount, errors };
}

// 2. APPLY: Inject links into content
export async function applyInternalLinks(): Promise<InjectResult> {
    const errors: string[] = [];
    let processed = 0;
    let updated = 0;

    try {
        // Fetch all rules
        const { data: rules } = await supabaseAdmin
            .from('internal_linking_rules')
            .select('*')
            .order('keyword', { ascending: false });

        if (!rules || rules.length === 0) return { processed: 0, updated: 0, errors: ['No rules found'] };

        const sortedRules = rules.sort((a, b) => b.keyword.length - a.keyword.length);

        // Fetch Content to Update (Only Posts for now)
        const { data: posts } = await supabaseAdmin.from('posts').select('id, title, content, slug').eq('status', 'published');

        if (posts) {
            for (const post of posts) {
                processed++;
                if (!post.content) continue;

                const originalContent = post.content;
                let newContent = originalContent;

                // Skip rules that point to THIS post
                const activeRules = sortedRules.filter(r => r.target_url !== `/news/${post.slug}` && r.target_url !== `/posts/${post.slug}`);

                newContent = injectLinksIntoHtml(originalContent, activeRules);

                if (newContent !== originalContent) {
                    await supabaseAdmin.from('posts').update({ content: newContent }).eq('id', post.id);
                    updated++;
                }
            }
        }

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown apply error';
        errors.push(msg);
    }

    return { processed, updated, errors };
}

// Helper: HTML Link Injector
function injectLinksIntoHtml(html: string, rules: LinkingRule[]): string {
    // 1. Hide existing tags and links
    const placeholders: string[] = [];
    const protectedHtml = html.replace(/(<a\b[^>]*>.*?<\/a>)|(<[^>]+>)/gi, (match) => {
        placeholders.push(match);
        return `###PL${placeholders.length - 1}###`;
    });

    let currentHtml = protectedHtml;
    const maxLinks = 5;
    let linkCount = 0;

    for (const rule of rules) {
        if (linkCount >= maxLinks) break;

        // Create Regex: exact match, word boundaries, case insensitive
        const escapedKw = rule.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b(${escapedKw})\\b`, 'i');

        if (regex.test(currentHtml)) {
            let replaced = false;
            currentHtml = currentHtml.replace(regex, (match) => {
                if (replaced) return match;
                replaced = true;
                linkCount++;
                return `<a href="${rule.target_url}" class="internal-link" title="${match}">${match}</a>`;
            });
        }
    }

    // Restore placeholders
    return currentHtml.replace(/###PL(\d+)###/g, (_, index) => placeholders[parseInt(index)]);
}
