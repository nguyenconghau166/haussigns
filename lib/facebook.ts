export async function postToFacebook(post: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    status: string;
}) {
    const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
    const ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://signs.haus'; // Default to production URL if not set

    if (!PAGE_ID || !ACCESS_TOKEN) {
        console.warn('Facebook Page ID or Access Token not configured. Skipping auto-post.');
        return { success: false, error: 'Missing configuration' };
    }

    if (post.status !== 'published') {
        return { success: false, error: 'Post is not published' };
    }

    const link = `${BASE_URL}/blog/${post.slug}`;
    const message = `${post.title}\n\n${post.excerpt || ''}`;

    try {
        const response = await fetch(`https://graph.facebook.com/v24.0/${PAGE_ID}/feed`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                link: link,
                access_token: ACCESS_TOKEN,
                published: true,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Facebook Graph API Error:', data);
            return { success: false, error: data.error?.message || 'Unknown error' };
        }

        console.log('Successfully posted to Facebook:', data);
        return { success: true, id: data.id };
    } catch (error) {
        console.error('Network error posting to Facebook:', error);
        return { success: false, error: 'Network error' };
    }
}
