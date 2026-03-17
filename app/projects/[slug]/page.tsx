import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Building2, ExternalLink } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface ProjectPageProps {
    params: {
        slug: string;
    };
}

function slugifyHeading(value: string): string {
    return value
        .toLowerCase()
        .replace(/<[^>]*>/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

function addHeadingIds(html: string): { html: string; toc: { id: string; text: string }[] } {
    const toc: { id: string; text: string }[] = [];
    const used = new Set<string>();

    const result = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_match, attrs, inner) => {
        const text = inner.replace(/<[^>]*>/g, '').trim();
        if (!text) return _match;
        const base = slugifyHeading(text) || 'section';
        let id = base;
        let count = 1;
        while (used.has(id)) {
            count += 1;
            id = `${base}-${count}`;
        }
        used.add(id);
        toc.push({ id, text });
        return `<h2${attrs} id="${id}">${inner}</h2>`;
    });

    return { html: result, toc };
}

function estimateReadTime(content: string): number {
    const plain = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = plain ? plain.split(' ').length : 0;
    return Math.max(1, Math.ceil(words / 220));
}

async function getProject(slug: string) {
    const { data: project, error } = await supabase
        .from('projects')
        .select(`
      *,
      project_categories (
        categories (
          name
        )
      )
    `)
        .eq('slug', slug)
        .single();

    if (error || !project) {
        return null;
    }

    return {
        ...project,
        categories: project.project_categories?.map((pc: { categories: { name: string } }) => pc.categories.name) || [],
    };
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
    const project = await getProject(params.slug);
    if (!project) return { title: 'Project Not Found' };

    return {
        title: `${project.title} | SignsHaus Projects`,
        description: project.description,
    };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
    const project = await getProject(params.slug);

    if (!project) {
        notFound();
    }

    const enriched = addHeadingIds(project.content || '');
    const readTime = estimateReadTime(project.content || project.description || '');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://signshaus.com';
    const pageUrl = `${siteUrl}/projects/${project.slug}`;
    const projectSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: project.title,
        description: project.description || '',
        image: project.featured_image ? [project.featured_image] : [],
        author: {
            '@type': 'Organization',
            name: 'SignsHaus'
        },
        publisher: {
            '@type': 'Organization',
            name: 'SignsHaus'
        },
        about: project.categories,
        datePublished: project.created_at,
        dateModified: project.updated_at || project.created_at,
        mainEntityOfPage: pageUrl
    };
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
            { '@type': 'ListItem', position: 2, name: 'Projects', item: `${siteUrl}/projects` },
            { '@type': 'ListItem', position: 3, name: project.title, item: pageUrl }
        ]
    };

    return (
        <main className="min-h-screen bg-white pt-24 pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(projectSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            {/* Back Link */}
            <div className="container px-4 mb-8">
                <Link href="/projects" className="inline-flex items-center text-slate-500 hover:text-slate-900 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Projects
                </Link>
            </div>

            <article className="container px-4">
                {/* Header */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    <div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {project.categories.map((cat: string) => (
                                <span key={cat} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold uppercase tracking-wide">
                                    {cat}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                            {project.title}
                        </h1>
                        <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                            {project.description}
                        </p>

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wide mb-8">
                            Case Study • {readTime} min read
                        </div>

                        <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-8">
                            <div>
                                <span className="text-slate-400 text-sm font-medium uppercase tracking-wider block mb-1">Client</span>
                                <div className="flex items-center text-slate-900 font-semibold">
                                    <Building2 className="h-4 w-4 mr-2 text-yellow-500" />
                                    {project.client}
                                </div>
                            </div>
                            <div>
                                <span className="text-slate-400 text-sm font-medium uppercase tracking-wider block mb-1">Location</span>
                                <div className="flex items-center text-slate-900 font-semibold">
                                    <MapPin className="h-4 w-4 mr-2 text-yellow-500" />
                                    {project.location}
                                </div>
                            </div>
                            <div>
                                <span className="text-slate-400 text-sm font-medium uppercase tracking-wider block mb-1">Year</span>
                                <div className="flex items-center text-slate-900 font-semibold">
                                    <Calendar className="h-4 w-4 mr-2 text-yellow-500" />
                                    {project.year}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                        <Image
                            src={project.featured_image}
                            alt={project.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                </div>

                {project.content && (
                    <div className="grid lg:grid-cols-4 gap-10 mb-16">
                        <div className="lg:col-span-3">
                            <div
                                className="prose-blog max-w-none"
                                dangerouslySetInnerHTML={{ __html: enriched.html }}
                            />
                        </div>
                        <aside className="lg:col-span-1">
                            <div className="sticky top-28 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">On this page</h3>
                                <ul className="space-y-2 text-sm">
                                    {enriched.toc.map((section) => (
                                        <li key={section.id}>
                                            <a href={`#${section.id}`} className="text-slate-600 hover:text-amber-700 transition-colors">
                                                {section.text}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </aside>
                    </div>
                )}

                {/* Gallery */}
                {project.gallery_images && project.gallery_images.length > 0 && (
                    <div className="mt-20">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8">Project Gallery</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {project.gallery_images.map((img: string, index: number) => (
                                <div key={index} className="relative h-64 rounded-xl overflow-hidden group">
                                    <Image
                                        src={img}
                                        alt={`${project.title} gallery image ${index + 1}`}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </article>

            {/* CTA */}
            <section className="container px-4 mt-32">
                <div className="bg-slate-900 rounded-3xl p-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to start your project?</h2>
                        <p className="text-slate-300 mb-8 max-w-xl mx-auto">
                            Contact us today for a free consultation and quote. Let&apos;s make your brand shine.
                        </p>
                        <Link href="/contact" className="inline-flex items-center px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-full transition-colors">
                            Get a Quote <ExternalLink className="ml-2 h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
