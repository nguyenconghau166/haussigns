import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getMaterials } from '@/lib/dataService';
import { Metadata } from 'next';
import MaterialsList from './MaterialsList';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Signage Material Guide | Haus Signs - Pros, Cons & Best Applications',
  description:
    'Compare signage materials: Acrylic, Stainless Steel, Aluminum, PVC, LED Neon and more. Understand pros, cons and best applications for your business signage.',
  openGraph: {
    title: 'Signage Material Guide | Haus Signs',
    description:
      'Understand the pros and cons of each material to make the best choice for your budget and needs.',
  },
};

export default async function MaterialsPage() {
  const materials = await getMaterials();

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="bg-slate-900 py-20 text-center text-white">
        <div className="container px-4">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
            Material <span className="text-yellow-500">Guide</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300 md:text-xl">
            Understand the pros and cons of each material to make the best choice for your budget and needs.
          </p>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="container px-4">
          <MaterialsList materials={materials} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
