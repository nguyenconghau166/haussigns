import BlogCard from '@/components/BlogCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

// Fallback data if DB is empty
const MOCK_POSTS = [
  {
    slug: 'acrylic-signage-guide-2024',
    title: 'The Ultimate Guide to Acrylic Build-Up Signage in Metro Manila',
    excerpt: 'Discover why acrylic signage is the top choice for retail stores in BGC and Makati. Learn about durability, price, and visual impact.',
    date: '2024-02-15',
    category: 'Materials',
    image: 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2674&auto=format&fit=crop',
  },
  {
    slug: 'stainless-steel-maintenance',
    title: 'How to Clean and Maintain Your Stainless Steel Signage',
    excerpt: 'Keep your outdoor signage looking brand new with these simple cleaning tips. Avoid rust and corrosion with proper care.',
    date: '2024-02-10',
    category: 'Maintenance',
    image: 'https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=2574&auto=format&fit=crop',
  },
  {
    slug: 'neon-lights-trend',
    title: '5 Creative Ways to Use LED Neon Lights for Your Cafe',
    excerpt: 'Transform your coffee shop into an Instagram-worthy spot with custom neon designs. See our latest projects in Quezon City.',
    date: '2024-02-05',
    category: 'Design Trends',
    image: 'https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?q=80&w=2548&auto=format&fit=crop',
  },
];

async function getPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        categories (
          name,
          slug
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return MOCK_POSTS;
    }

    if (!data || data.length === 0) {
      return MOCK_POSTS;
    }

    return data.map(post => {
      // Handle category mapping safely
      const categoryName = Array.isArray(post.categories)
        ? post.categories[0]?.name
        : (post.categories as any)?.name || 'General';

      return {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        date: post.created_at,
        category: categoryName,
        image: post.featured_image || 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd',
      };
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return MOCK_POSTS;
  }
}

export const revalidate = 60; // Revalidate every 60 seconds

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* Blog Header */}
        <section className="bg-slate-900 py-20 text-center text-white">
          <div className="container px-4">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
              Signs<span className="text-yellow-500">Haus</span> Insights
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-300 md:text-xl">
              Expert tips, industry trends, and technical guides for business owners in Metro Manila.
            </p>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="container py-16 px-4 md:px-6">
          <div className="mb-10 flex flex-col items-center justify-between gap-4 md:flex-row">
            <h2 className="text-2xl font-bold text-slate-900">Latest Articles</h2>

            {/* Simple Category Filter Placeholder */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {['All', 'Materials', 'Design', 'Permits', 'Maintenance'].map((cat) => (
                <button
                  key={cat}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${cat === 'All'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post as any} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
