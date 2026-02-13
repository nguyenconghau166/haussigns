'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

export interface Project {
    id: string;
    title: string;
    slug: string;
    category: string;
    image: string;
    location: string;
    client?: string;
    year?: string;
}

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group"
        >
            <Link href={`/projects/${project.slug}`} className="block h-full">
                <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-4">
                    <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        View Project
                    </div>
                </div>

                <div>
                    <span className="text-yellow-600 font-bold text-xs uppercase tracking-wider mb-2 block">
                        {project.category}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-yellow-600 transition-colors">
                        {project.title}
                    </h3>
                    <div className="flex items-center text-slate-500 text-sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        {project.location}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
