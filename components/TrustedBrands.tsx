'use client';

import Image from 'next/image';
import { useSiteSettings } from '@/lib/useSiteSettings';

interface TrustedBrand {
  id: string | number;
  name: string;
  logo_url: string;
  website_url?: string | null;
}

export default function TrustedBrands({ brands = [] }: { brands?: TrustedBrand[] }) {
  const { get: getSetting } = useSiteSettings();

  if (!brands || brands.length === 0) return null;

  const line1 = getSetting('trusted_brands_line1', 'Trusted By');
  const line2 = getSetting('trusted_brands_line2', 'Visionary Brands');

  return (
    <section className="bg-slate-900 border-y border-slate-800/60 py-10">
      <div className="container">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-14">
          <div className="flex-shrink-0">
            <p className="eyebrow leading-[1.7]">
              {line1}<br />{line2}
            </p>
          </div>

          <div className="flex-1 flex flex-wrap items-center justify-start lg:justify-between gap-x-10 gap-y-6">
            {brands.map((brand) => {
              const LogoImg = (
                <div className="relative h-8 md:h-10 w-24 md:w-32 opacity-60 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-300">
                  <Image
                    src={brand.logo_url}
                    alt={brand.name}
                    fill
                    sizes="(max-width: 768px) 96px, 128px"
                    className="object-contain object-center"
                  />
                </div>
              );

              return brand.website_url ? (
                <a
                  key={brand.id}
                  href={brand.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={brand.name}
                  className="block"
                >
                  {LogoImg}
                </a>
              ) : (
                <div key={brand.id} aria-label={brand.name}>
                  {LogoImg}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
