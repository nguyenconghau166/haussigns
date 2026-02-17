import { getPage, getServices } from '@/lib/dataService';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CTABanner from '@/components/CTABanner';
import { Metadata } from 'next';
import ServiceGrid from '@/components/ServiceGrid';

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
    const page = await getPage('services');

    if (!page) {
        return {
            title: 'Our Services | SignsHaus',
        };
    }

    return {
        title: page.meta_title || `${page.title} | SignsHaus`,
        description: page.meta_description,
        openGraph: {
            images: page.featured_image ? [page.featured_image] : [],
        },
    };
}

export default async function ServicesPage() {
    const [page, services] = await Promise.all([
        getPage('services'),
        getServices()
    ]);

    return (
        <main className="min-h-screen flex flex-col bg-white">
            <Navbar />

            {/* Hero */}
            <section className="relative py-20 md:py-28 overflow-hidden bg-slate-900">
                {page?.featured_image && (
                    <div
                        className="absolute inset-0 z-0 opacity-30 bg-cover bg-center"
                        style={{ backgroundImage: `url(${page.featured_image})` }}
                    />
                )}
                <div className="absolute inset-0 gradient-hero z-1" />

                <div className="container relative z-10 text-center">
                    <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-400 mb-3">
                        What We Do
                    </span>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl mb-6">
                        {page?.title || 'Our Services'}
                    </h1>
                    <div
                        className="max-w-3xl mx-auto text-lg text-slate-200"
                        dangerouslySetInnerHTML={{ __html: page?.content || 'We provide end-to-end signage solutions from design to installation.' }}
                    />
                </div>
            </section>

            {/* Services Grid Content */}
            <ServiceGrid services={services || []} />

            <CTABanner />
            <Footer />
        </main>
    );
}
