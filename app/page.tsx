import HomePageClient from '@/components/HomePageClient';
import {
  getMaterials,
  getPosts,
  getProducts,
  getProjects,
  getServices,
  getTestimonials,
  getTrustedBrands,
} from '@/lib/dataService';

export const revalidate = 300;

export default async function Home() {
  const [products, services, projects, testimonials, posts, materials, trustedBrands] = await Promise.all([
    getProducts(6),
    getServices(6),
    getProjects(5),
    getTestimonials(4),
    getPosts(6),
    getMaterials(5),
    getTrustedBrands(8),
  ]);

  return (
    <HomePageClient
      products={products}
      services={services}
      projects={projects}
      testimonials={testimonials}
      posts={posts || []}
      materials={materials || []}
      trustedBrands={trustedBrands || []}
    />
  );
}
