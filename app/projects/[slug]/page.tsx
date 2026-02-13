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
        categories: project.project_categories?.map((pc: any) => pc.categories.name) || [],
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

    return (
        <main className="min-h-screen bg-white pt-24 pb-20">
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
                            Contact us today for a free consultation and quote. Let's make your brand shine.
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
