import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface BlogPost {
  title: string;
  excerpt: string;
  slug: string;
  date: string;
  image: string;
  category: string;
}

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg hover:-translate-y-1">
      <article className="flex flex-col h-full">
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 backdrop-blur-sm">
            {post.category}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-2 text-sm text-slate-500">
            {formatDate(post.date)}
          </div>
          <h3 className="mb-3 text-xl font-bold leading-tight text-slate-900 group-hover:text-yellow-600">
            {post.title}
          </h3>
          <p className="mb-4 flex-1 text-slate-600 line-clamp-3">
            {post.excerpt}
          </p>
          <div className="flex items-center text-sm font-semibold text-slate-900 group-hover:text-yellow-600">
            Read Article <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
}
