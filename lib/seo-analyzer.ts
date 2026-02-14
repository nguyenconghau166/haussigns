import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

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

export async function analyzePage(url: string): Promise<SeoResult> {
    try {
        const response = await fetch(url);
        const html = await response.text();

        // 1. Basic Extraction (Regex for now as we don't have cheerio)
        const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : "";

        const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
        const metaDescription = metaDescMatch ? metaDescMatch[1] : "";

        const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
        const h1 = h1Match ? h1Match[1] : "";

        // Simple word count (strip tags)
        const textContent = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        const wordCount = textContent.split(" ").length;

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
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const aiData = JSON.parse(jsonMatch[0]);
                aioScore = aiData.aioScore || 50;
                if (aiData.suggestions && Array.isArray(aiData.suggestions)) {
                    suggestions.push(...aiData.suggestions);
                }
            }
        } catch (error) {
            console.error("AI Analysis failed:", error);
            aioScore = 50; // Fallback
            suggestions.push({ category: 'AIO', issue: 'Analysis Failed', suggestion: 'Could not perform AI analysis at this time.', priority: 'Low' });
        }

        return {
            title,
            metaDescription,
            h1,
            wordCount,
            seoScore: Math.max(0, seoScore),
            aioScore: Math.max(0, aioScore),
            suggestions
        };

    } catch (error) {
        console.error("Failed to fetch page:", error);
        throw new Error("Failed to fetch page content");
    }
}
