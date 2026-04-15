'use client';

import Link from 'next/link';
import { ShoppingBag, Building2, Utensils, Stethoscope, Hotel, GraduationCap, ArrowRight, Layers } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag, Building2, Utensils, Stethoscope, Hotel, GraduationCap
};

interface IndustriesGridProps {
  items: Record<string, unknown>[];
}

export default function IndustriesGrid({ items }: IndustriesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {items.map((item: any) => {
        const IconComponent = ICON_MAP[item.icon] || Layers;
        const hasCoverImage = Boolean(item.image);

        return (
          <Link
            href={`/services/industries/${item.slug}`}
            key={item.id}
            className="group block h-full"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all h-full flex flex-col relative overflow-hidden">
              {hasCoverImage ? (
                <>
                  <div className="relative w-full h-48 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <div className="w-8 h-8 bg-white/90 backdrop-blur-sm text-amber-600 rounded-lg flex items-center justify-center shadow-sm">
                        <IconComponent className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-amber-600 transition-colors">{item.title}</h3>
                    <p className="text-slate-500 mb-6 flex-grow text-sm leading-relaxed">{item.description}</p>
                    <div className="mt-auto pt-6 border-t border-slate-100">
                      {item.recommended && item.recommended.length > 0 ? (
                        <>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Recommended:</span>
                          <div className="flex flex-wrap gap-2">
                            {item.recommended.slice(0, 3).map((rec: string, i: number) => (
                              <span key={i} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[10px] font-semibold rounded-md border border-slate-100 group-hover:border-amber-100 group-hover:bg-amber-50 transition-colors">
                                {rec}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          View Solutions <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-8 flex flex-col h-full">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 relative z-10 group-hover:bg-amber-500 group-hover:text-white transition-colors shadow-lg shadow-amber-500/10">
                      <IconComponent className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-amber-600 transition-colors">{item.title}</h3>
                    <p className="text-slate-500 mb-6 flex-grow text-sm leading-relaxed">{item.description}</p>
                    <div className="mt-auto pt-6 border-t border-slate-100">
                      {item.recommended && item.recommended.length > 0 ? (
                        <>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Recommended:</span>
                          <div className="flex flex-wrap gap-2">
                            {item.recommended.slice(0, 3).map((rec: string, i: number) => (
                              <span key={i} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[10px] font-semibold rounded-md border border-slate-100 group-hover:border-amber-100 group-hover:bg-amber-50 transition-colors">
                                {rec}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          View Solutions <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
