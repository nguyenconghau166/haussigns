import HomePageClient from '@/components/HomePageClient';
import {
  getMaterials,
  getPosts,
  getProducts,
  getProjects,
  getServices,
  getTestimonials,
} from '@/lib/dataService';

export const revalidate = 300;

export default async function Home() {
  const [products, services, projects, testimonials, posts, materials] = await Promise.all([
    getProducts(8),
    getServices(),
    getProjects(8),
    getTestimonials(4),
    getPosts(3),
    getMaterials(8),
  ]);

  return (
    <HomePageClient
      products={products}
      services={services}
      projects={projects}
      testimonials={testimonials}
      posts={posts || []}
      materials={materials || []}
    />
  );
}
