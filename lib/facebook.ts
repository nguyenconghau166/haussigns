import { supabaseAdmin } from './supabase';
import { generateContent as generateContentOpenAI } from './openai';

const FB_GRAPH_API = 'https://graph.facebook.com/v25.0';
const QUEUE_DELAY_MINUTES = 30;

// =============================================
// Types
// =============================================

interface FacebookPageConfig {
  pageId: string;
  accessToken: string;
  style: 'professional' | 'casual';
  name: string;
  key: string;
}

export interface FacebookPostInput {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string | null;
  content?: string | null;
  tags?: string[] | null;
}

interface FacebookPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

// =============================================
// Config: Read configured Facebook pages from env
// =============================================

function getConfiguredPages(): FacebookPageConfig[] {
  const pages: FacebookPageConfig[] = [];

  // Page 1 — Business/Professional
  const p1Id = process.env.FB_PAGE1_ID;
  const p1Token = process.env.FB_PAGE1_TOKEN;
  if (p1Id && p1Token) {
    pages.push({
      pageId: p1Id,
      accessToken: p1Token,
      style: 'professional',
      name: process.env.FB_PAGE1_NAME || 'Business Page',
      key: 'page1',
    });
  }

  // Page 2 — Community/Casual
  const p2Id = process.env.FB_PAGE2_ID;
  const p2Token = process.env.FB_PAGE2_TOKEN;
  if (p2Id && p2Token) {
    pages.push({
      pageId: p2Id,
      accessToken: p2Token,
      style: 'casual',
      name: process.env.FB_PAGE2_NAME || 'Community Page',
      key: 'page2',
    });
  }

  // Backward compatibility: legacy env vars → page1
  if (pages.length === 0) {
    const legacyId = process.env.FACEBOOK_PAGE_ID;
    const legacyToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    if (legacyId && legacyToken) {
      pages.push({
        pageId: legacyId,
        accessToken: legacyToken,
        style: 'professional',
        name: 'Facebook Page',
        key: 'page1',
      });
    }
  }

  return pages;
}

// =============================================
// AI Caption Generation
// =============================================

async function generateFacebookCaptions(
  post: FacebookPostInput,
  blogUrl: string
): Promise<{ professional: string; casual: string }> {
  const contentSnippet = (post.content || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);

  const tagsStr = (post.tags || []).slice(0, 5).join(', ');

  const systemPrompt = `You are a social media specialist. Generate 2 Facebook post captions for the same blog article.
Each caption must end with the blog link on a new line.

ARTICLE INFO:
- Title: "${post.title}"
- Excerpt: "${post.excerpt || ''}"
- Tags: ${tagsStr || 'none'}
- Content snippet: "${contentSnippet}"
- Blog URL: ${blogUrl}

OUTPUT FORMAT (JSON only, no markdown):
{
  "professional": "...",
  "casual": "..."
}

RULES FOR "professional" (Business/B2B page):
- 100-200 characters (before the link line)
- Professional, authoritative tone
- Include 1 specific data point or insight from the article
- End with a clear CTA (e.g., "See the full breakdown →")
- NO emoji
- Last line: "🔗 ${blogUrl}"

RULES FOR "casual" (Community page):
- 80-150 characters (before the link line)
- Friendly, conversational tone
- Start with an engaging question or relatable hook
- Use 2-3 relevant emoji
- Include a practical tip or benefit
- Last line: "🔗 ${blogUrl}"`;

  try {
    const result = await generateContentOpenAI(
      systemPrompt,
      'Generate the 2 captions now.',
      'gpt-4o-mini'
    );

    if (!result) throw new Error('Empty AI response');

    const cleaned = result
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleaned) as { professional: string; casual: string };

    // Ensure both captions exist and contain the blog URL
    const ensureLink = (caption: string) => {
      if (!caption.includes(blogUrl)) {
        return `${caption}\n\n🔗 ${blogUrl}`;
      }
      return caption;
    };

    return {
      professional: ensureLink(parsed.professional || `${post.title}\n\n🔗 ${blogUrl}`),
      casual: ensureLink(parsed.casual || `${post.title}\n\n🔗 ${blogUrl}`),
    };
  } catch (error) {
    console.error('Failed to generate FB captions, using fallback:', error);
    return {
      professional: `${post.title}\n\n${post.excerpt || ''}\n\n🔗 ${blogUrl}`,
      casual: `📢 ${post.title}\n\n${post.excerpt || ''}\n\n🔗 ${blogUrl}`,
    };
  }
}

// =============================================
// Queue: Add posts to facebook_queue with delay
// =============================================

export async function queueFacebookPosts(post: FacebookPostInput): Promise<{
  queued: number;
  pages: string[];
}> {
  const pages = getConfiguredPages();

  if (pages.length === 0) {
    console.warn('No Facebook pages configured. Skipping queue.');
    return { queued: 0, pages: [] };
  }

  // Check for existing queue entries to prevent duplicates
  const { data: existing } = await supabaseAdmin
    .from('facebook_queue')
    .select('page_key')
    .eq('post_id', post.id)
    .in('status', ['pending', 'posted']);

  const alreadyQueued = new Set((existing || []).map(e => e.page_key));
  const pagesToQueue = pages.filter(p => !alreadyQueued.has(p.key));

  if (pagesToQueue.length === 0) {
    console.log('All pages already queued/posted for this post. Skipping.');
    return { queued: 0, pages: [] };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://signs.haus';
  const blogUrl = `${baseUrl}/blog/${post.slug}`;
  const scheduledAt = new Date(Date.now() + QUEUE_DELAY_MINUTES * 60 * 1000).toISOString();

  // Generate captions (1 API call for both styles)
  const captions = await generateFacebookCaptions(post, blogUrl);

  const queueEntries = pagesToQueue.map(page => ({
    post_id: post.id,
    page_key: page.key,
    page_name: page.name,
    caption: page.style === 'professional' ? captions.professional : captions.casual,
    image_url: post.featured_image || null,
    blog_url: blogUrl,
    status: 'pending',
    scheduled_at: scheduledAt,
  }));

  const { error } = await supabaseAdmin
    .from('facebook_queue')
    .insert(queueEntries);

  if (error) {
    console.error('Failed to queue Facebook posts:', error);
    return { queued: 0, pages: [] };
  }

  console.log(`Queued ${queueEntries.length} Facebook posts for ${scheduledAt} (${QUEUE_DELAY_MINUTES}min delay)`);
  return {
    queued: queueEntries.length,
    pages: pagesToQueue.map(p => p.name),
  };
}

// =============================================
// Post: Send to Facebook Graph API
// =============================================

async function postToFacebookPage(
  pageConfig: FacebookPageConfig,
  caption: string,
  imageUrl: string | null,
  blogUrl: string
): Promise<FacebookPostResult> {
  const { pageId, accessToken } = pageConfig;

  // Try photo post first (higher engagement)
  if (imageUrl) {
    try {
      const response = await fetch(`${FB_GRAPH_API}/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: imageUrl,
          caption: caption,
          access_token: accessToken,
          published: true,
        }),
      });

      const data = await response.json();

      if (response.ok && (data.id || data.post_id)) {
        return { success: true, postId: data.post_id || data.id };
      }

      // If photo post fails, fall through to link post
      console.warn(`Photo post failed for ${pageConfig.name}, trying link post:`, data.error?.message);
    } catch (err) {
      console.warn(`Photo post network error for ${pageConfig.name}, trying link post:`, err);
    }
  }

  // Fallback: link post
  try {
    const response = await fetch(`${FB_GRAPH_API}/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: caption,
        link: blogUrl,
        access_token: accessToken,
        published: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || 'Unknown Facebook API error';
      const errCode = data.error?.code;
      console.error(`Facebook API error [${pageConfig.name}] (code ${errCode}):`, errMsg);
      return { success: false, error: `[${errCode}] ${errMsg}` };
    }

    return { success: true, postId: data.id };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Network error';
    console.error(`Facebook network error [${pageConfig.name}]:`, errMsg);
    return { success: false, error: errMsg };
  }
}

// =============================================
// Process Queue: Called by cron every 5 minutes
// =============================================

export async function processFacebookQueue(): Promise<{
  processed: number;
  posted: number;
  failed: number;
}> {
  const now = new Date().toISOString();

  // Fetch pending items that are due
  const { data: pendingItems, error } = await supabaseAdmin
    .from('facebook_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(10); // Process max 10 per cron run

  if (error || !pendingItems?.length) {
    return { processed: 0, posted: 0, failed: 0 };
  }

  const pages = getConfiguredPages();
  const pageMap = new Map(pages.map(p => [p.key, p]));

  let posted = 0;
  let failed = 0;

  for (const item of pendingItems) {
    const pageConfig = pageMap.get(item.page_key);

    if (!pageConfig) {
      await supabaseAdmin
        .from('facebook_queue')
        .update({
          status: 'failed',
          error: `Page config not found for key: ${item.page_key}`,
          posted_at: now,
        })
        .eq('id', item.id);
      failed++;
      continue;
    }

    const result = await postToFacebookPage(
      pageConfig,
      item.caption,
      item.image_url,
      item.blog_url
    );

    if (result.success) {
      await supabaseAdmin
        .from('facebook_queue')
        .update({
          status: 'posted',
          facebook_post_id: result.postId,
          posted_at: new Date().toISOString(),
        })
        .eq('id', item.id);
      posted++;
    } else {
      await supabaseAdmin
        .from('facebook_queue')
        .update({
          status: 'failed',
          error: result.error,
          posted_at: new Date().toISOString(),
        })
        .eq('id', item.id);
      failed++;
    }
  }

  return { processed: pendingItems.length, posted, failed };
}

// =============================================
// Cancel: Cancel pending queue items for a post
// =============================================

export async function cancelFacebookQueue(postId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('facebook_queue')
    .update({ status: 'cancelled' })
    .eq('post_id', postId)
    .eq('status', 'pending')
    .select('id');

  return data?.length || 0;
}

// =============================================
// Legacy: Keep backward compatibility
// =============================================

export async function postToFacebook(post: {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  status: string;
}) {
  if (post.status !== 'published') {
    return { success: false, error: 'Post is not published' };
  }

  const result = await queueFacebookPosts({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
  });

  return {
    success: result.queued > 0,
    queued: result.queued,
    pages: result.pages,
  };
}
