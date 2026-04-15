import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getIndustries } from '@/lib/dataService';
import { Metadata } from 'next';
import IndustriesGrid from './IndustriesGrid';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Industries We Serve | Haus Signs - Signage Solutions by Sector',
  description:
    'Tailored signage solutions for retail, restaurants, healthcare, hotels, offices and more. See how Haus Signs serves every business sector in Metro Manila.',
  openGraph: {
    title: 'Industries We Serve | Haus Signs',
    description:
      'Tailored signage solutions for every business sector in the Philippines.',
  },
};

export default async function IndustriesPage() {
  const industries = await getIndustries();

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="bg-slate-900 py-20 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-0" />
        <div className="container px-4 relative z-10">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
            Industries We <span className="text-yellow-500">Serve</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300 md:text-xl">
            Tailored signage solutions for every business sector in the Philippines.
          </p>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="container px-4">
          <IndustriesGrid items={industries} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
