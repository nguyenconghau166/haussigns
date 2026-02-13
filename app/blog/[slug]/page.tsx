import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatDate } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Revalidate every 60 seconds (or logic for ISR)
export const revalidate = 60;

// Helper to fetch post
async function getPost(slug: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      categories (
        name,
        slug
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    console.error('Error fetching post:', error);
    return null;
  }
  return data;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const postData = await getPost(slug);

  if (!postData) {
    notFound();
  }

  // Transform data to match UI needs
  // The 'categories' field from join might be an object or array depending on client generation, 
  // but usually for Many-to-One it is an object.
  // We'll cast to any for safety or assume it adheres to the shape.
  const categoryName = Array.isArray(postData.categories)
    ? postData.categories[0]?.name
    : (postData.categories as any)?.name || 'General';

  const post = {
    title: postData.title,
    date: postData.created_at,
    category: categoryName,
    author: 'SignsHaus Team', // Static for now, or add author table later
    image: postData.featured_image || 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2674&auto=format&fit=crop',
    content: postData.content || '',
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Post Hero */}
        <div className="relative h-[400px] w-full bg-slate-900">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 container pb-12 pt-32">
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center text-sm font-medium text-slate-300 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
            </Link>
            <div className="mb-4 flex items-center gap-4 text-sm font-medium text-yellow-500">
              <span className="uppercase tracking-wider">{post.category}</span>
              <span className="h-1 w-1 rounded-full bg-slate-500" />
              <span>{formatDate(post.date)}</span>
            </div>
            <h1 className="max-w-4xl text-3xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              {post.title}
            </h1>
          </div>
        </div>

        {/* Post Content */}
        <article className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <div
              className="prose prose-lg prose-slate first-letter:float-left first-letter:mr-3 first-letter:text-7xl first-letter:font-bold first-letter:text-slate-900"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <div className="mt-12 border-t pt-8">
              <h3 className="mb-4 text-lg font-bold text-slate-900">Share this article</h3>
              <div className="flex gap-4">
                <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Facebook</button>
                <button className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600">Twitter</button>
                <button className="rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900">Copy Link</button>
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts Placeholder - Could be made dynamic later */}
        <section className="bg-slate-50 py-16">
          <div className="container">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">Related Articles</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Reuse BlogCard components here with different data */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="h-40 bg-slate-200 rounded-md mb-4 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=2574&auto=format&fit=crop)' }}></div>
                <h3 className="font-bold text-lg mb-2">How to Clean Stainless Steel</h3>
                <p className="text-slate-500 text-sm">Keep your outdoor signage looking brand new with these simple cleaning tips.</p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="h-40 bg-slate-200 rounded-md mb-4 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2674&auto=format&fit=crop)' }}></div>
                <h3 className="font-bold text-lg mb-2">Why Choose Acrylic?</h3>
                <p className="text-slate-500 text-sm">Versatile, durable, and premium finish for indoor and outdoor use.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

