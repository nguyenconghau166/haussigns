'use client';

import { useState } from 'react';
import ProjectCard, { Project } from './ProjectCard';

interface ProjectsGridProps {
    initialProjects: Project[];
    categories: string[];
}

export default function ProjectsGrid({ initialProjects, categories }: ProjectsGridProps) {
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredProjects = activeCategory === 'All'
        ? initialProjects
        : initialProjects.filter(p => p.category === activeCategory);

    return (
        <div>
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
                <button
                    onClick={() => setActiveCategory('All')}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeCategory === 'All'
                            ? 'bg-slate-900 text-white shadow-lg scale-105'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                >
                    All Projects
                </button>
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeCategory === category
                                ? 'bg-slate-900 text-white shadow-lg scale-105'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((project, index) => (
                    <ProjectCard key={project.id} project={project} index={index} />
                ))}
            </div>

            {filteredProjects.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-slate-500 text-lg">No projects found in this category.</p>
                </div>
            )}
        </div>
    );
}
