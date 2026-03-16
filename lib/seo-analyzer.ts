import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const ALLOWED_CATEGORIES = new Set(['Technical', 'Content', 'AIO', 'Schema']);
const ALLOWED_PRIORITIES = new Set(['High', 'Medium', 'Low']);

export interface SeoResult {
    title: string;
    metaDescription: string;
    h1: string;
    wordCount: number;
    seoScore: number;
    aioScore: number;
    suggestions: Suggestion[];
}

export interface Suggestion {
    category: 'Technical' | 'Content' | 'AIO' | 'Schema';
    issue: string;
    suggestion: string;
    priority: 'High' | 'Medium' | 'Low';
}

function normalizeSuggestion(raw: Partial<Suggestion>): Suggestion {
    const category = ALLOWED_CATEGORIES.has(raw.category || '')
        ? (raw.category as Suggestion['category'])
        : 'AIO';
    const priority = ALLOWED_PRIORITIES.has(raw.priority || '')
        ? (raw.priority as Suggestion['priority'])
        : 'Medium';

    return {
        category,
        issue: (raw.issue || '').trim() || 'Optimization opportunity',
        suggestion: (raw.suggestion || '').trim() || 'Review this page and improve structure/content clarity.',
        priority,
    };
}

function extractTextContent(html: string): string {
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseJsonFromModel(text: string): Record<string, unknown> | null {
    const normalized = text
        .replace(/```json/gi, '```')
        .trim();
    const fenced = normalized.match(/```([\s\S]*?)```/);
    const rawPayload = fenced ? fenced[1] : normalized;
    const objectMatch = rawPayload.match(/\{[\s\S]*\}/);
    if (!objectMatch) {
        return null;
    }

    try {
        return JSON.parse(objectMatch[0]);
    } catch {
        return null;
    }
}

export async function analyzePage(url: string): Promise<SeoResult> {
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Unsupported URL protocol');
        }

        const response = await fetch(url, {
            signal: AbortSignal.timeout(20000),
            headers: {
                'User-Agent': 'SignsHausBot/1.0 (+https://signs.haus)',
                Accept: 'text/html,application/xhtml+xml',
            },
        });

        if (!response.ok) {
            throw new Error(`Target returned HTTP ${response.status}`);
        }

        const html = await response.text();

        // 1. Basic Extraction (Regex for now as we don't have cheerio)
        const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : "";

        const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
            || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
        const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : "";

        const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
        const h1 = h1Match ? h1Match[1].trim() : "";

        // Simple word count (strip tags)
        const textContent = extractTextContent(html);
        const wordCount = textContent ? textContent.split(" ").length : 0;

        // 2. Rule-based SEO Score
        let seoScore = 100;
        const suggestions: Suggestion[] = [];

        if (!title) {
            seoScore -= 20;
            suggestions.push({ category: 'Technical', issue: 'Missing Title Tag', suggestion: 'Add a descriptive title tag.', priority: 'High' });
        } else if (title.length < 10 || title.length > 70) {
            seoScore -= 5;
            suggestions.push({ category: 'Content', issue: 'Title Length', suggestion: 'Keep title between 10-70 characters.', priority: 'Medium' });
        }

        if (!metaDescription) {
            seoScore -= 20;
            suggestions.push({ category: 'Technical', issue: 'Missing Meta Description', suggestion: 'Add a meta description for better CTR.', priority: 'High' });
        } else if (metaDescription.length < 50 || metaDescription.length > 160) {
            seoScore -= 5;
            suggestions.push({ category: 'Content', issue: 'Meta Description Length', suggestion: 'Keep description between 50-160 characters.', priority: 'Medium' });
        }

        if (!h1) {
            seoScore -= 15;
            suggestions.push({ category: 'Content', issue: 'Missing H1', suggestion: 'Ensure the page has a single H1 tag.', priority: 'High' });
        }

        if (wordCount < 300) {
            seoScore -= 10;
            suggestions.push({ category: 'Content', issue: 'Low Word Count', suggestion: 'Content is too thin. Aim for at least 300 words.', priority: 'Medium' });
        }

        // 3. AI-based AIO Score & Analysis
        let aioScore = 0;
        try {
            const prompt = `
        Analyze the following HTML content for AIO (Artificial Intelligence Optimization) and detailed SEO. 
        Focus on:
        1. Structure (headings, lists, tables).
        2. Entity clarity (is the main topic obvious to a machine?).
        3. Schema markup presence (look for JSON-LD).
        4. E-E-A-T signals.

        HTML Content (truncated):
        ${html.substring(0, 15000)}

        Return a JSON object with:
        - aioScore: number (0-100)
        - suggestions: Array<{category: 'AIO'|'Schema', issue: string, suggestion: string, priority: 'High'|'Medium'|'Low'}>
        `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const aiData = parseJsonFromModel(responseText);

            if (aiData) {
                const maybeScore = Number(aiData.aioScore);
                aioScore = Number.isFinite(maybeScore) ? maybeScore : 50;
                if (Array.isArray(aiData.suggestions)) {
                    suggestions.push(...aiData.suggestions.map((item) => normalizeSuggestion(item as Partial<Suggestion>)));
                }
            } else {
                aioScore = 50;
            }
        } catch (error) {
            console.error("AI Analysis failed:", error);
            aioScore = 50; // Fallback
            suggestions.push({ category: 'AIO', issue: 'Analysis Failed', suggestion: 'Could not perform AI analysis at this time.', priority: 'Low' });
        }

        const normalizedSuggestions = suggestions.map((s) => normalizeSuggestion(s));

        return {
            title,
            metaDescription,
            h1,
            wordCount,
            seoScore: Math.max(0, seoScore),
            aioScore: Math.max(0, Math.min(100, Math.round(aioScore))),
            suggestions: normalizedSuggestions
        };

    } catch (error) {
        console.error("Failed to fetch page:", error);
        throw new Error("Failed to fetch page content");
    }
}
