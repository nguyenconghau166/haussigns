'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ImagePicker from '@/components/admin/ImagePicker';
import RichTextEditor from '@/components/admin/RichTextEditor';

interface ProjectEditorProps {
    params: Promise<{
        id: string;
    }>;
}

export default function ProjectEditor({ params }: ProjectEditorProps) {
    const { id } = use(params);
    const router = useRouter();
    const isNew = id === 'new';
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        client: '',
        location: '',
        year: new Date().getFullYear().toString(),
        description: '', // Legacy simple description
        content: '', // Rich text content
        featured_image: '',
        cover_image: '', // New field, sync with featured_image for now
        gallery_images: [] as string[],
        categories: [] as string[],
        type: 'Signage', // For AI context
        challenges: '' // For AI context
    });

    useEffect(() => {
        if (!isNew) {
            fetchProject();
        } else {
            setLoading(false);
        }
    }, [id]);

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/admin/projects/${id}`);
            const data = await res.json();
            if (data.project) {
                setFormData({
                    ...data.project,
                    categories: data.project.categories || [],
                    type: 'Signage', // Default
                    challenges: '',
                    // Fallback content if empty
                    content: data.project.content || data.project.description || '',
                    cover_image: data.project.cover_image || data.project.featured_image || ''
                });
            }
        } catch (error) {
            console.error('Error fetching project:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAIWrite = async () => {
        if (!formData.title || !formData.client) {
            alert('Please enter at least Title and Client name.');
            return;
        }

        setGeneratingAI(true);
        try {
            const res = await fetch('/api/admin/ai/generate-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    client: formData.client,
                    location: formData.location || 'Metro Manila',
                    type: formData.type,
                    challenges: formData.challenges
                })
            });

            const data = await res.json();
            if (data.description) {
                setFormData(prev => ({
                    ...prev,
                    description: data.description,
                    // Convert plain text AI result to simple HTML paragraph for rich editor
                    content: prev.content ? prev.content : `<p>${data.description}</p>`
                }));
            } else {
                alert('Failed to generate content: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error("AI Error", error);
            alert('Error generating content');
        } finally {
            setGeneratingAI(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = isNew ? '/api/admin/projects' : `/api/admin/projects/${id}`;
            const method = isNew ? 'POST' : 'PUT';

            // Auto-generate slug if empty
            const payload = {
                ...formData,
                featured_image: formData.cover_image, // Sync for backward compatibility
                slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push('/admin/projects');
            } else {
                const error = await res.json();
                alert('Error saving project: ' + error.error);
            }
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/admin/projects" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isNew ? 'New Project' : 'Edit Project'}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                        <h2 className="font-semibold text-lg text-slate-900 border-b pb-2 mb-4">Basic Information</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Project Title</label>
                                <Input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. SM Mall of Asia Signage"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Client Name</label>
                                <Input
                                    required
                                    value={formData.client}
                                    onChange={e => setFormData({ ...formData, client: e.target.value })}
                                    placeholder="e.g. SM Prime Holdings"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Location</label>
                                <Input
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g. Pasay City"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Completion Year</label>
                                <Input
                                    value={formData.year}
                                    onChange={e => setFormData({ ...formData, year: e.target.value })}
                                    placeholder="2024"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Slug (URL)</label>
                            <Input
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="Leave empty to auto-generate from title"
                                className="bg-slate-50"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4 relative">
                        <div className="flex items-center justify-between border-b pb-2 mb-4">
                            <h2 className="font-semibold text-lg text-slate-900">Project Description</h2>
                            <Button
                                type="button"
                                onClick={handleAIWrite}
                                disabled={generatingAI}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600"
                                size="sm"
                            >
                                {generatingAI ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Writing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        AI Auto-Write
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* AI Context Fields */}
                        <div className="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-4 rounded-lg">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-500 uppercase">Signage Type (AI Context)</label>
                                <Input
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    placeholder="e.g. Outdoor Pylon Sign"
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-500 uppercase">Challenges/Notes (AI Context)</label>
                                <Input
                                    value={formData.challenges}
                                    onChange={e => setFormData({ ...formData, challenges: e.target.value })}
                                    placeholder="e.g. High wind load, night installation"
                                    className="bg-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Detailed Content</label>
                            <RichTextEditor
                                value={formData.content}
                                onChange={(content) => setFormData({ ...formData, content })}
                                placeholder="Detailed project description..."
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                        <h2 className="font-semibold text-lg text-slate-900 border-b pb-2 mb-4">Media</h2>

                        <div className="space-y-2">
                            <ImagePicker
                                label="Featured / Cover Image"
                                value={formData.cover_image}
                                onChange={(url) => setFormData({ ...formData, cover_image: url, featured_image: url })}
                            />
                        </div>

                        {/* TODO: Implement multi-image picker for gallery */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Gallery Images (Comma separated URLs for now)</label>
                            <textarea
                                rows={4}
                                value={formData.gallery_images?.join(', ')}
                                onChange={(e: any) => setFormData({ ...formData, gallery_images: e.target.value.split(',').map((s: string) => s.trim()) })}
                                placeholder="https://..., https://..."
                                className="w-full text-xs p-2 border rounded"
                            />
                            <p className="text-xs text-slate-500">Enhanced gallery uploader coming soon.</p>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-lg"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5 mr-2" />
                                Save Project
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
