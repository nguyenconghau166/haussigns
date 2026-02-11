
/**
 * Pings Google and other search engines to notify them of sitemap updates.
 * This should be called whenever a new post is published or updated.
 */
export async function pingSearchEngines() {
    const sitemapUrl = 'https://signshaus.ph/sitemap.xml'; // Using the user's domain

    try {
        // Google (Note: Deprecated but still sometimes used/recommended)
        await fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`);

        // Bing
        await fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`);

        console.log(`Successfully pinged search engines for sitemap: ${sitemapUrl}`);
        return true;
    } catch (error) {
        console.error('Failed to ping search engines:', error);
        return false;
    }
}
