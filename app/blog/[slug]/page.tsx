import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatDate } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  // In a real app, fetch post data based on params.slug
  const { slug } = await params;
  const post = {
    title: slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    date: '2024-02-15',
    category: 'Materials',
    author: 'SignsHaus Team',
    image: 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2674&auto=format&fit=crop',
    content: `
      <h2>Introduction</h2>
      <p>Acrylic signage has become the gold standard for modern businesses in Metro Manila. Its versatility, durability, and premium finish make it an ideal choice for both indoor and outdoor applications.</p>
      
      <h3>Why Choose Acrylic?</h3>
      <p>Compared to traditional panaflex, acrylic offers a much more sophisticated look. It can be laser-cut into precise shapes, making it perfect for intricate logos and lettering.</p>
      
      <ul>
        <li><strong>High Durability:</strong> Resistant to UV rays and harsh weather conditions.</li>
        <li><strong>Versatile Finishes:</strong> Available in glossy, matte, or frosted textures.</li>
        <li><strong>Illumination:</strong> Works perfectly with LED modules for face-lit or halo-lit effects.</li>
      </ul>

      <h3>Cost Considerations</h3>
      <p>While acrylic is more expensive upfront than tarpaulin or panaflex, its longevity means you save money in the long run. A well-maintained acrylic sign can last 5-10 years without significant fading.</p>

      <h2>Installation Process</h2>
      <p>Our team at SignsHaus handles the entire process from design to installation. We use high-grade stainless steel spacers or industrial adhesives depending on the wall surface.</p>

      <blockquote>
        &quot;A quality sign is the first handshake with your customer.&quot;
      </blockquote>

      <h3>Contact Us Today</h3>
      <p>Ready to upgrade your storefront? Contact us for a free ocular inspection and quote.</p>
    `,
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

        {/* Related Posts Placeholder */}
        <section className="bg-slate-50 py-16">
          <div className="container">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">Related Articles</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Reuse BlogCard components here with different data */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="h-40 bg-slate-200 rounded-md mb-4"></div>
                <h3 className="font-bold text-lg mb-2">3 Tips for Durable Outdoor Signs</h3>
                <p className="text-slate-500 text-sm">Learn how to choose materials that withstand Manila's heat and rain.</p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="h-40 bg-slate-200 rounded-md mb-4"></div>
                <h3 className="font-bold text-lg mb-2">Permit Requirements 101</h3>
                <p className="text-slate-500 text-sm">Don't get fined! Check our updated list of LGU requirements.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
