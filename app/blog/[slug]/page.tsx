import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock3, Share2, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { sanitizeHtml } from '@/lib/security';
import { buildCombinedSchema, safeJsonLdStringify } from '@/lib/schema-builder';
import { extractFaqFromContent } from '@/lib/faq-schema';

export const revalidate = 60;

type PostRecord = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  featured_image: string | null;
  created_at: string;
  updated_at: string | null;
  tags: string[] | null;
  categories?: { name?: string; slug?: string } | Array<{ name?: string; slug?: string }> | null;
};

function normalizeCategoryName(post: PostRecord): string {
  if (Array.isArray(post.categories)) return post.categories[0]?.name || 'General';
  return post.categories?.name || 'General';
}

function estimateReadingTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function extractFaqItems(content: string): Array<{ question: string; answer: string }> {
  // Match FAQ sections: find <section data-faq="true"> or <h2>.*FAQ.*</h2> followed by <h3>Q</h3><p>A</p> pairs
  const faqSectionMatch = content.match(/<section[^>]*data-faq[^>]*>([\s\S]*?)<\/section>/i)
    || content.match(/<h2[^>]*>[^<]*(?:FAQ|Frequently Asked)[^<]*<\/h2>([\s\S]*?)(?=<h2|<section|<footer|$)/i);

  if (!faqSectionMatch) return [];

  const faqContent = faqSectionMatch[1] || faqSectionMatch[0];
  const pairs: Array<{ question: string; answer: string }> = [];

  // Extract h3 (question) followed by p (answer)
  const qaPairs = [...faqContent.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)];
  for (const match of qaPairs) {
    const question = (match[1] || '').replace(/<[^>]*>/g, '').trim();
    const answer = (match[2] || '').replace(/<[^>]*>/g, '').trim();
    if (question && answer) {
      pairs.push({ question, answer });
    }
  }

  return pairs;
}

function extractHeadings(content: string): Array<{ id: string; text: string }> {
  const matches = [...content.matchAll(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi)];
  return matches
    .map((match) => {
      const attrs = match[1] || '';
      const rawText = (match[2] || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      if (!rawText) return null;
      const idMatch = attrs.match(/id="([^"]+)"/i);
      const id = idMatch?.[1] || slugify(rawText);
      return { id, text: rawText };
    })
    .filter((item): item is { id: string; text: string } => Boolean(item));
}

async function getPostBySlug(slug: string): Promise<PostRecord | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      slug,
      content,
      excerpt,
      meta_title,
      meta_description,
      featured_image,
      created_at,
      updated_at,
      tags,
      categories (
        name,
        slug
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) return null;
  return data as PostRecord;
}

async function getRelatedPosts(excludeId: string) {
  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, featured_image, created_at')
    .eq('status', 'published')
    .neq('id', excludeId)
    .order('created_at', { ascending: false })
    .limit(3);

  return data || [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://signs.haus';
  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;
  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || `Read ${post.title} on SignsHaus.`;
  const image = post.featured_image || '/logo-web.png';

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
      publishedTime: post.created_at,
      modifiedTime: post.updated_at || post.created_at,
      images: [{ url: image, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const postData = await getPostBySlug(slug);

  if (!postData) notFound();

  const categoryName = normalizeCategoryName(postData);
  const contentHtml = sanitizeHtml(postData.content || '');
  const readingTime = estimateReadingTime(contentHtml);
  const headings = extractHeadings(contentHtml);
  const relatedPosts = await getRelatedPosts(postData.id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://signs.haus';
  const canonicalUrl = `${siteUrl}/blog/${postData.slug}`;

  const faqItems = extractFaqFromContent(contentHtml);

  // Build combined @graph schema (Article + BreadcrumbList + FAQPage + HowTo + LocalBusiness)
  const combinedSchema = buildCombinedSchema(
    {
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.excerpt || undefined,
      meta_description: postData.meta_description || undefined,
      featured_image: postData.featured_image,
      content: contentHtml,
      tags: postData.tags || undefined,
      created_at: postData.created_at,
      updated_at: postData.updated_at || undefined,
      categoryName,
    },
    faqItems,
    {
      siteUrl,
      companyName: 'SignsHaus',
      companyDescription: 'SignsHaus — Premium Signage Maker in Metro Manila, Philippines',
      logo: `${siteUrl}/logo-web.png`,
      phone: '+63 917 123 4567',
      address: {
        city: 'Makati',
        region: 'Metro Manila',
        country: 'PH',
      },
      geo: {
        latitude: 14.5547,
        longitude: 121.0244,
      },
      socialLinks: [
        'https://www.facebook.com/signshaus',
      ],
      priceRange: '₱₱-₱₱₱',
    }
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-slate-950">
          <div className="absolute inset-0">
            <Image
              src={postData.featured_image || 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2674&auto=format&fit=crop'}
              alt={postData.title}
              fill
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.25),transparent_40%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/70 to-slate-950" />
          </div>

          <div className="container relative z-10 py-16 md:py-24">
            <Link href="/blog" className="mb-6 inline-flex items-center text-sm font-medium text-slate-300 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
              <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1">{categoryName}</span>
              <span className="inline-flex items-center gap-1.5 text-slate-200 normal-case tracking-normal text-sm font-medium">
                <CalendarDays className="h-4 w-4" /> {formatDate(postData.created_at)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-200 normal-case tracking-normal text-sm font-medium">
                <Clock3 className="h-4 w-4" /> {readingTime} min read
              </span>
            </div>

            <h1 className="max-w-4xl text-balance text-3xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
              {postData.title}
            </h1>

            {postData.excerpt && (
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-200">
                {postData.excerpt}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-2">
              {(postData.tags || []).slice(0, 6).map((tag) => (
                <span key={tag} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-10 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  <Sparkles className="h-3.5 w-3.5" /> SEO + AIO optimized article
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Share2 className="h-4 w-4" />
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-slate-200 px-3 py-1.5 hover:border-slate-300 hover:bg-slate-50"
                  >
                    Facebook
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-slate-200 px-3 py-1.5 hover:border-slate-300 hover:bg-slate-50"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>

              <div className="prose-blog" dangerouslySetInnerHTML={{ __html: contentHtml }} />

              <div className="mt-12 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">Need project support?</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">Get a signage recommendation for your location</h3>
                <p className="mt-2 text-slate-700">Tell us your business type, target location, and budget range. Our team will propose the right material and format for long-term visibility.</p>
                <Link href="/contact" className="mt-4 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                  Talk to SignsHaus
                </Link>
              </div>
            </article>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {headings.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">On this page</h2>
                  <nav>
                    <ul className="space-y-2">
                      {headings.map((heading) => (
                        <li key={heading.id}>
                          <a href={`#${heading.id}`} className="text-sm text-slate-700 hover:text-amber-600">
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Article info</h2>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>Published: {formatDate(postData.created_at)}</li>
                  {postData.updated_at && postData.updated_at !== postData.created_at && (
                    <li className="font-medium text-emerald-700">Updated: {formatDate(postData.updated_at)}</li>
                  )}
                  <li>Category: {categoryName}</li>
                  <li>Reading time: {readingTime} min</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        {relatedPosts.length > 0 && (
          <section className="border-t border-slate-200 bg-white py-14">
            <div className="container">
              <h2 className="mb-6 text-2xl font-bold text-slate-900">Related articles</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {relatedPosts.map((item) => (
                  <Link
                    key={item.id}
                    href={`/blog/${item.slug}`}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="mb-3 overflow-hidden rounded-xl bg-slate-100">
                      <div className="relative aspect-video">
                        <Image
                          src={item.featured_image || 'https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=2574&auto=format&fit=crop'}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{formatDate(item.created_at)}</p>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600">{item.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.excerpt || 'Read more insights from our team.'}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Combined @graph JSON-LD: Article + BreadcrumbList + FAQPage + HowTo + LocalBusiness */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(combinedSchema) }} />
      <Footer />
    </div>
  );
}
