'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, MapPin, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

interface Project {
    id: string;
    title: string;
    client: string;
    location: string;
    year: string;
    featured_image: string;
    project_categories?: {
        categories: {
            name: string;
        }
    }[];
}

export default function AdminProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/admin/projects');
            const data = await res.json();
            setProjects(data.projects || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            const res = await fetch(`/api/admin/projects/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setProjects(projects.filter(p => p.id !== id));
            } else {
                alert('Failed to delete project');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    const filteredProjects = projects.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Quản lý Dự án</h1>
                    <p className="text-slate-500 mt-1">Danh sách các dự án đã thực hiện</p>
                </div>
                <Link href="/admin/projects/new">
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm Dự án mới
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Tìm kiếm dự án, khách hàng..."
                        className="pl-10 max-w-md border-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Đang tải...</div>
                ) : filteredProjects.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        Chưa có dự án nào. Hãy tạo dự án đầu tiên!
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Dự án</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Khách hàng</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Thời gian</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Danh mục</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProjects.map((project) => (
                                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                                {project.featured_image ? (
                                                    <Image
                                                        src={project.featured_image}
                                                        alt={project.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Img</div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{project.title}</p>
                                                <div className="flex items-center text-xs text-slate-500 mt-1">
                                                    <MapPin className="h-3 w-3 mr-1" />
                                                    {project.location || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-slate-700 font-medium">
                                            <Building2 className="h-4 w-4 mr-2 text-slate-400" />
                                            {project.client}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {project.year}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {project.project_categories?.map((pc, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                                    {pc.categories.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/projects/${project.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(project.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
