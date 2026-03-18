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
    getProducts(6),
    getServices(6),
    getProjects(6),
    getTestimonials(4),
    getPosts(6),
    getMaterials(6),
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
