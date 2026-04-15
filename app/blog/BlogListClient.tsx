'use client';

import { useState } from 'react';
import BlogCard from '@/components/BlogCard';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image: string;
}

interface BlogListClientProps {
  posts: BlogPost[];
  categories: string[];
}

export default function BlogListClient({ posts, categories }: BlogListClientProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredPosts = activeCategory === 'All'
    ? posts
    : posts.filter(p => p.category === activeCategory);

  return (
    <section className="container py-16 px-4 md:px-6">
      <div className="mb-10 flex flex-col items-center justify-between gap-4 md:flex-row">
        <h2 className="text-2xl font-bold text-slate-900">Latest Articles</h2>

        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                cat === activeCategory
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No articles found in this category.</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <BlogCard key={post.slug} post={post as any} />
          ))}
        </div>
      )}
    </section>
  );
}
