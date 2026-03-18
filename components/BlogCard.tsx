import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface BlogPost {
  title: string;
  excerpt?: string;
  slug: string;
  date?: string;
  created_at?: string;
  image?: string;
  featured_image?: string;
  thumbnail_image?: string;
  category?: string;
  categories?: { name?: string } | Array<{ name?: string }>;
}

export default function BlogCard({ post }: { post: BlogPost }) {
  const imageSrc = post.thumbnail_image || post.image || post.featured_image || '/logo-web.png';
  const publishedAt = post.date || post.created_at || new Date().toISOString();
  const categoryLabel = Array.isArray(post.categories)
    ? post.categories[0]?.name || post.category || 'General'
    : post.categories?.name || post.category || 'General';

  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-1">
      <article className="flex flex-col h-full">
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
          <Image
            src={imageSrc}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4 rounded-full bg-white/90 dark:bg-slate-800/90 px-3 py-1 text-xs font-semibold text-slate-900 dark:text-white backdrop-blur-sm">
            {categoryLabel}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-2 text-sm text-slate-500 dark:text-slate-400">
            {formatDate(publishedAt)}
          </div>
          <h3 className="mb-3 text-xl font-bold leading-tight text-slate-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-amber-400">
            {post.title}
          </h3>
          <p className="mb-4 flex-1 text-slate-600 dark:text-slate-400 line-clamp-3">
            {post.excerpt || 'Read the latest insights from SignsHaus.'}
          </p>
          <div className="flex items-center text-sm font-semibold text-slate-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-amber-400">
            Read Article <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
}
