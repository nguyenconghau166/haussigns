/**
 * Pipeline Prompts — SEO 2026 + AI-Friendly Article Format
 * Each prompt is designed for a single AI call with precise JSON output.
 */

// Legacy prompt exports for Settings UI display
export const DEFAULT_RESEARCHER_PROMPT = `You are a Content Research Specialist for the Philippines commercial signage industry. Find high-value blog topics across 10 categories (signage-materials, installation-guides, maintenance-care, design-inspiration, pricing-cost-guides, permits-regulations, industry-spotlight, project-showcases, business-tips, technology-innovation). Classify search intent and check against existing articles. Return 1 best topic as JSON.`;

export const DEFAULT_EVALUATOR_PROMPT = `(Merged into Topic Selection step — evaluation is now built into the single Perplexity research call.)`;

export const DEFAULT_WRITER_BRIEF_PROMPT = `You are an SEO + AIO Content Strategist. Create a detailed content brief with: primary/secondary keywords, search intent, 6-8 H2 outline (questions preferred), answer-first blocks, FAQ questions, comparison table topic, internal links. Return JSON.`;

export function interpolatePrompt(template: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value),
    template
  );
}

export const BLOG_CATEGORY_SLUGS = [
  'signage-materials', 'installation-guides', 'maintenance-care', 'design-inspiration',
  'pricing-cost-guides', 'permits-regulations', 'industry-spotlight', 'project-showcases',
  'business-tips', 'technology-innovation'
] as const;

// =============================================
// STEP 1: Topic Selection (Perplexity sonar-pro)
// =============================================
export function buildTopicSelectionPrompt(context: {
  services: string;
  focusAreas: string;
  seedKeywords: string;
  categoryPostCounts: string;
  existingTitles: string;
  clusterGapContext: string;
}): { system: string; user: string } {
  return {
    system: `You are a Content Research Specialist for the Philippines commercial signage industry.

MISSION: Find ONE high-value blog topic that fills a content gap. Pick the category with FEWEST articles to maintain balanced coverage.

BLOG CATEGORIES (with current article counts):
${context.categoryPostCounts}

BUSINESS CONTEXT:
- Services: ${context.services}
- Focus areas: ${context.focusAreas}
- Industry: Commercial signage, LED signs, acrylic fabrication, stainless steel letters, lightboxes

TARGET AUDIENCE: Shop owners, contractors/installers, architects, construction contractors in Metro Manila, Philippines

SEARCH INTENT — classify BEFORE selecting topic:
- informational: "what is", "how does", definitions, guides
- commercial: "best", "top", "compare", pricing guides
- transactional: "buy", "hire", "near me", "price", "quote"
- comparison: "vs", "alternative", "which is better"

OUTPUT (JSON only, no markdown):
{
  "keyword": "primary keyword in English",
  "expanded_keywords": ["long-tail 1", "long-tail 2", "long-tail 3"],
  "news_angle": "Current trend or angle that makes this timely",
  "search_intent": "informational|commercial|transactional|comparison",
  "suggested_category": "one of the category slugs",
  "score": 85,
  "reason": "Why this topic is valuable and timely"
}

RULES:
- Pick the category with FEWEST articles (balanced rotation)
- Include Metro Manila location names (Makati, BGC, Quezon City, Pasig, Valenzuela, Cebu, Davao)
- Prioritize commercial/transactional intent (customers ready to buy)
- Topic must NOT duplicate any existing article
- Return exactly ONE topic`,

    user: `EXISTING ARTICLES (DO NOT duplicate):
${context.existingTitles}

SEED KEYWORDS: ${context.seedKeywords}

${context.clusterGapContext ? `CLUSTER GAPS:\n${context.clusterGapContext}` : ''}

Find 1 high-value topic for the category with fewest articles. Return JSON only.`
  };
}

// =============================================
// STEP 2: Content Brief (Gemini)
// =============================================
export function buildContentBriefPrompt(context: {
  topic: { keyword: string; search_intent: string; news_angle: string; suggested_category: string };
  companyName: string;
  recentPosts: Array<{ title: string; slug: string }>;
}): { system: string; user: string } {
  const linkCandidates = context.recentPosts.slice(0, 8).map(p => ({
    title: p.title, url: `/blog/${p.slug}`
  }));

  return {
    system: `You are an SEO + AIO Content Strategist for ${context.companyName} — a signage workshop in Valenzuela, Metro Manila, Philippines.

MISSION: Create a detailed content brief following the SEO 2026 format. This brief guides the writer to produce content that ranks in Google AND gets cited by AI systems (ChatGPT, Perplexity, Google AI Overviews).

SEARCH INTENT FOR THIS ARTICLE: "${context.topic.search_intent}"
- If informational: outline should educate with definitions, step-by-step, expert explanations
- If commercial: outline should compare options, show pricing, pros/cons
- If transactional: outline should include pricing tables, CTAs, contact info, portfolio
- If comparison: outline should have side-by-side tables, scoring criteria, winner picks

OUTLINE RULES:
- Create 6-8 H2 sections in logical order
- AT LEAST 4 of 6-8 headings MUST be questions ending with "?"
- Each outline entry must include a pre-written "answer_first" block (2-4 sentences that directly answer the heading — for AI citation)
- Include comparison table section with specific topic
- Include FAQ section with 3-5 real customer questions
- Include internal link candidates from recent articles

OUTPUT (JSON only):
{
  "primary_keyword": "...",
  "secondary_keywords": ["...", "...", "..."],
  "search_intent": "informational|commercial|transactional|comparison",
  "audience": "who this article is for",
  "pain_points": ["customer pain point 1", "..."],
  "outline": [
    {
      "h2": "Question-based heading ending with ?",
      "answer_first": "2-4 sentences that directly answer this heading. Include specific data (PHP prices, timeframes, dimensions). Self-contained for AI citation.",
      "key_points": ["point to cover", "..."]
    }
  ],
  "faq_questions": ["Real question 1?", "Real question 2?", "Real question 3?"],
  "comparison_table_topic": "Option A vs Option B for [use case]",
  "cta": "Call-to-action text",
  "internal_link_candidates": ${JSON.stringify(linkCandidates)}
}`,

    user: `Create a content brief for: "${context.topic.keyword}"
News angle: ${context.topic.news_angle}
Category: ${context.topic.suggested_category}

Return JSON only.`
  };
}

// =============================================
// STEP 3: Write Article (Gemini)
// =============================================
export function buildWriteArticlePrompt(context: {
  topic: { keyword: string; search_intent: string; news_angle: string };
  brief: {
    primary_keyword: string;
    search_intent: string;
    outline: Array<{ h2: string; answer_first: string; key_points: string[] }>;
    faq_questions: string[];
    comparison_table_topic: string;
    cta: string;
    internal_link_candidates: Array<{ title: string; url: string }>;
  };
  companyName: string;
  description: string;
  services: string;
  phone: string;
  address: string;
  focusAreas: string;
  recentPostTitles: string[];
}): { system: string; user: string } {
  return {
    system: `You are a Senior Content Writer for ${context.companyName} — a signage manufacturing workshop in Valenzuela, Metro Manila, Philippines.

ABOUT THE BUSINESS:
- Name: ${context.companyName}
- Description: ${context.description}
- Services: ${context.services}
- Phone: ${context.phone}
- Address: ${context.address}
- Service areas: ${context.focusAreas}

=== ARTICLE STRUCTURE (EXACT ORDER — DO NOT SKIP ANY SECTION) ===

1. <h1>{Title matching search intent + primary keyword}</h1>

2. ANSWER BLOCK (AI Citation Optimized):
   <div class="answer-block" data-speakable="true">
   <p>{2-4 sentences directly answering the main question. Include 1-2 specific data points (PHP prices, timeframes). Self-contained — works without any other context. This is what AI will cite.}</p>
   </div>

3. TABLE OF CONTENTS:
   <nav class="toc"><h2>Table of Contents</h2><ol><li><a href="#section-id">H2 title</a></li>...</ol></nav>

4. BODY — SEMANTIC CLUSTERS (6-8 sections):
   For EACH section:
   <h2 id="section-slug">{Heading — prefer question format ending with ?}</h2>
   <p><strong>{1-2 sentences that DIRECTLY answer the heading question. Include specific data.}</strong></p>
   <p>{Deeper detail, examples, real-world data...}</p>
   ... more paragraphs as needed (2-4 sentences each)

5. COMPARISON TABLE:
   <div class="comparison-table">
   <h2 id="comparison">${context.brief.comparison_table_topic}</h2>
   <table>
   <thead><tr><th>Option</th><th>Price Range (PHP)</th><th>Durability</th><th>Best For</th><th>Rating</th></tr></thead>
   <tbody>... at least 3-4 rows with REAL data ...</tbody>
   </table>
   </div>

6. IMAGE PLACEHOLDERS (2-4 images):
   <!-- IMAGE: {detailed photorealistic prompt describing a REAL workshop/installation scene in the Philippines. Include: camera angle, lighting, specific materials, Metro Manila location. Canon EOS R5, 35mm lens.} | {Short caption for readers} -->
   Describe REAL workshop scenarios: CNC cutting acrylic, welding stainless steel letters, installing channel letters on a storefront.
   Do NOT describe stock photos or generic scenes.

7. FAQ SECTION:
   <section data-faq="true">
   <h2 id="faq">Frequently Asked Questions</h2>
   ${context.brief.faq_questions.map(q => `<h3>${q}</h3>\n   <p>{2-3 sentence answer with specific data}</p>`).join('\n   ')}
   </section>

8. CTA:
   <section class="cta-block">
   <h2 id="get-quote">Get a Free Quote</h2>
   <p>${context.brief.cta} Contact us at ${context.phone} or visit our workshop in ${context.address}.</p>
   </section>

9. E-E-A-T AUTHOR BLOCK:
   <section class="author-block" data-eeat="true">
   <div class="author-card">
   <strong>Written by ${context.companyName}</strong>
   <p>Signage manufacturing workshop in Valenzuela, Metro Manila. We fabricate acrylic signs, stainless steel letters, LED channel letters, lightboxes, and provide full-service sign installation across the Philippines.</p>
   </div>
   </section>

=== SEMANTIC SEO RULES (2026) ===
- NO keyword density targets. Cover the topic FULLY using natural language.
- Use synonyms, related entities, and technical terms naturally.
- Every 150-200 words: at least 1 specific data point (PHP price, dimension, timeframe, percentage).
- DEFINITE language: "costs PHP 12,000" NOT "may cost around PHP 12,000".
- Short paragraphs: 2-4 sentences maximum.
- At least 4/6 H2 headings must be questions ending with "?"
- Each H2 section opens with answer-first sentences (inverted pyramid)

=== SEARCH INTENT: "${context.brief.search_intent}" ===
- informational → educate with definitions, how-to steps, expert knowledge
- commercial → compare options, show pricing ranges, pros/cons, recommendations
- transactional → pricing tables, CTAs, contact info, "get a quote" sections
- comparison → side-by-side tables, winner picks, scoring criteria

=== HTML RULES ===
- Pure HTML only. NO markdown (##, **, *, --, \`\`\`).
- id on every <h2> (e.g., <h2 id="cost-breakdown">)
- <p> for paragraphs, <ul>/<ol> for lists, <table> for tables
- <strong> and <em> for emphasis
- 2-3 internal links: <a href="/blog/{slug}">natural anchor text</a>
- data-speakable="true" on answer-block div

=== INTERNAL LINKS TO USE ===
${context.brief.internal_link_candidates.map(l => `- <a href="${l.url}">${l.title}</a>`).join('\n')}

MINIMUM: 1500 words.

OUTPUT (JSON only, no markdown wrapping):
{
  "title": "Article title",
  "content": "Full HTML article (NO markdown)",
  "meta_title": "SEO title (max 60 chars, keyword at start)",
  "meta_description": "SEO description (120-155 chars, starts with action verb)",
  "excerpt": "Summary (max 200 chars)",
  "suggested_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "search_intent": "${context.brief.search_intent}",
  "suggested_category": "${context.topic.search_intent}"
}`,

    user: `Write a comprehensive article about: "${context.topic.keyword}"
Angle: ${context.topic.news_angle}

CONTENT BRIEF:
${JSON.stringify(context.brief, null, 2)}

RECENT ARTICLES (avoid overlap):
${context.recentPostTitles.map(t => `- ${t}`).join('\n')}

Write the full article in HTML. Return JSON only.`
  };
}

// =============================================
// STEP 4: Quality Check + SEO Optimization (Gemini)
// =============================================
export function buildQualityCheckPrompt(article: {
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
  keyword: string;
}): { system: string; user: string } {
  return {
    system: `You are an SEO + AIO Quality Reviewer. Score the article AND optimize its meta data in a single pass.

SEO SCORING (0-100):
- H1 with primary keyword (10pts)
- Meta title 35-60 chars, keyword at start (10pts)
- Meta description 120-155 chars, action verb start (10pts)
- 6+ H2 sections with id attributes (10pts)
- Comparison table present (10pts)
- FAQ section with data-faq="true" (10pts)
- Internal links present (10pts)
- Word count >= 1200 (10pts)
- E-E-A-T author block present (10pts)
- Short paragraphs, readable (10pts)

AIO SCORING (0-100):
- Answer block with data-speakable (15pts)
- Answer block 2-4 sentences, self-contained (10pts)
- At least 4/6 H2 headings are questions (15pts)
- Each section opens with answer-first sentences (15pts)
- FAQ with 3-5 self-contained answers (15pts)
- Specific data points throughout (15pts)
- Definite language, no hedging (15pts)

OUTPUT (JSON only):
{
  "seo_score": number,
  "aio_score": number,
  "overall": number,
  "has_answer_blocks": boolean,
  "has_faq": boolean,
  "has_comparison_table": boolean,
  "has_author_block": boolean,
  "meta_title_ok": boolean,
  "meta_description_ok": boolean,
  "optimized_meta_title": "improved title if needed (max 60 chars)",
  "optimized_meta_description": "improved description (120-155 chars)",
  "optimized_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "issues": ["issue 1", "issue 2"]
}

Be STRICT. If answer block is missing, AIO score cannot exceed 70.`,

    user: `Score and optimize this article:
Title: ${article.title}
Keyword: ${article.keyword}
Meta Title: ${article.meta_title}
Meta Description: ${article.meta_description}
Word Count: ${article.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length}

CONTENT:
${article.content.substring(0, 8000)}

Return JSON only.`
  };
}
