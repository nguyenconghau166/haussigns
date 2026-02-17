import { supabase } from '@/lib/supabase';
import ProjectsGrid from '@/components/ProjectsGrid';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Our Projects | SignsHaus',
    description: 'Explore our recent signage projects across Metro Manila. From retail to corporate, see how we bring brands to life.',
};

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

async function getProjects() {
    // Fetch projects with their categories
    const { data: projects, error } = await supabase
        .from('projects')
        .select(`
      *,
      project_categories (
        categories (
          name
        )
      )
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        return [];
    }

    // Transform data for the UI
    return projects.map((project) => ({
        id: project.id,
        title: project.title,
        slug: project.slug,
        // Get the first category name, or default to 'General'
        category: project.project_categories?.[0]?.categories?.name || 'General',
        image: project.featured_image || '/images/placeholder.jpg',
        location: project.location || 'Metro Manila',
        client: project.client,
        year: project.year,
    }));
}

async function getCategories() {
    const { data: categories } = await supabase
        .from('categories')
        .select('name')
        .eq('type', 'industry'); // Filter by industry type for main tabs

    return categories?.map(c => c.name) || [];
}

export default async function ProjectsPage() {
    const projects = await getProjects();
    const categories = await getCategories();

    return (
        <main className="min-h-screen bg-white pt-0 pb-0">
            <Navbar />
            {/* Header */}
            <section className="bg-slate-900 text-white py-20 mb-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
                <div className="container px-4 relative z-10 text-center">
                    <span className="text-yellow-500 font-bold tracking-widest uppercase text-sm mb-4 block">Our Portfolio</span>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6">Recent Projects</h1>
                    <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                        Discover how we help businesses across the Philippines stand out with premium signage solutions.
                    </p>
                </div>
            </section>

            <div className="container px-4">
                <ProjectsGrid initialProjects={projects} categories={categories} />
            </div>
            <Footer />
        </main>
    );
}
