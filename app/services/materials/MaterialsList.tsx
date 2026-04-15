'use client';

import Link from 'next/link';

interface MaterialsListProps {
  materials: Record<string, unknown>[];
}

export default function MaterialsList({ materials }: MaterialsListProps) {
  return (
    <div className="space-y-12">
      {materials.map((material: any) => (
        <Link href={`/services/materials/${material.slug}`} key={material.id} className="block group">
          <div className="flex flex-col md:flex-row gap-8 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
            <div className="w-full md:w-1/3 aspect-video md:aspect-square relative rounded-xl overflow-hidden bg-slate-200">
              {material.image ? (
                <img
                  src={material.image}
                  alt={material.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">No Image</div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-amber-600 transition-colors">{material.name}</h3>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-bold text-green-600 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                    Pros
                  </h4>
                  <ul className="space-y-1 text-slate-600 text-sm">
                    {Array.isArray(material.pros) && material.pros.map((pro: string) => <li key={pro}>• {pro}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-red-500 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                    Cons
                  </h4>
                  <ul className="space-y-1 text-slate-600 text-sm">
                    {Array.isArray(material.cons) && material.cons.map((con: string) => <li key={con}>• {con}</li>)}
                  </ul>
                </div>
              </div>

              {material.best_for && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <span className="font-bold text-yellow-800 text-xs uppercase tracking-wide block mb-1">Best Application</span>
                  <p className="text-slate-700 text-sm font-medium">{material.best_for}</p>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
