'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Sparkles, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ImagePicker from '@/components/admin/ImagePicker';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { defaultAIBrief } from '@/components/admin/AIBriefPanel';
import ContentQualityCard from '@/components/admin/ContentQualityCard';
import NonBlogSeoTemplatePanel from '@/components/admin/NonBlogSeoTemplatePanel';

interface ProductEditorProps {
    params: Promise<{
        id: string;
    }>;
}

export default function ProductEditor({ params }: ProductEditorProps) {
    const { id } = use(params);
    const router = useRouter();
    const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
    const isNew = id === 'new';
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [aiBrief, setAiBrief] = useState(defaultAIBrief);
    const [qaSignal, setQaSignal] = useState(0);

    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '', // Short description
        content: '', // Rich text
        meta_title: '',
        meta_description: '',
        cover_image: '',
        gallery_images: [] as string[],
        features: [] as string[], // JSON array in DB
        is_published: true,
        img_prompt: '' // For AI image gen context if needed
    });

    // Temp state for features input (comma separated)
    const [featuresInput, setFeaturesInput] = useState('');

    // Track dirty state on form changes
    const updateForm = (updates: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
        setDirty(true);
    };

    useEffect(() => {
        if (!isNew) {
            fetchProduct();
        } else {
            setLoading(false);
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/admin/products/${id}`);
            const data = await res.json();
            if (data.product) {
                setFormData((prev) => ({
                    ...prev,
                    ...data.product,
                    features: data.product.features || [],
                    meta_title: data.product.meta_title || '',
                    meta_description: data.product.meta_description || ''
                }));
                setFeaturesInput((data.product.features || []).join('\n'));
            }
        } catch (error) {
            console.error("Failed to fetch product", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAIWrite = async () => {
        if (!formData.name) { toastWarning("Please enter a product name first"); return; }
        setGenerating(true);
        try {
            const res = await fetch('/api/ai/product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: formData.name,
                    features: featuresInput, // Use raw input as context
                    type: 'product',
                    language: 'en', // Default to EN for now, can add selector
                    aiBrief
                })
            });
            const data = await res.json();
            if (data.success && data.data) {
                const result = data.data;
                setFormData(prev => ({
                    ...prev,
                    description: result.short_description,
                    content: `<h2>${result.title}</h2><p>${result.long_description.replace(/\n/g, '<br>')}</p><h3>Key Features</h3><ul>${result.features_list.map((f: string) => `<li>${f}</li>`).join('')}</ul><blockquote>${result.call_to_action}</blockquote>`,
                    meta_title: result.meta_title || prev.meta_title,
                    meta_description: result.meta_description || prev.meta_description
                }));
                setQaSignal((prev) => prev + 1);
                // Also update features list if AI structured them better? 
                // For now, let's keep user manual input separate or overwrite if they want.
                if (result.features_list) {
                    setFeaturesInput(result.features_list.join('\n'));
                }
            } else {
                toastError('Generation failed');
            }
        } catch (error) {
            console.error(error);
            toastError('Error generating');
        } finally {
            setGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toastWarning('Product name is required');
            return;
        }
        setSaving(true);

        const slug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const payload = {
            ...formData,
            slug,
            features: featuresInput.split('\n').filter(f => f.trim() !== '')
        };

        try {
            // Check for duplicate slug on new products
            if (isNew) {
                const checkRes = await fetch('/api/admin/products');
                const checkData = await checkRes.json();
                const existing = (checkData.products || []).find((p: any) => p.slug === slug);
                if (existing) {
                    toastError(`Slug "${slug}" đã tồn tại. Vui lòng đổi tên sản phẩm.`);
                    setSaving(false);
                    return;
                }
            }

            const url = isNew ? '/api/admin/products' : `/api/admin/products/${id}`;
            const method = isNew ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setDirty(false);
                toastSuccess(isNew ? 'Product created!' : 'Product saved!');
                router.push('/admin/products');
            } else {
                const err = await res.json();
                toastError(err.error || 'Failed to save');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/admin/products" className="p-2 hover:bg-slate-100 rounded-full">
                    <ArrowLeft className="h-5 w-5 text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{isNew ? 'New Product' : 'Edit Product'}</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="font-semibold text-lg">Product Details</h2>
                            <Button type="button" onClick={handleAIWrite} disabled={generating} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                AI Auto-Write
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Product Name</label>
                            <Input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. 3D Acrylic Letter"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Slug</label>
                            <Input
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="auto-generated"
                                className="bg-slate-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Short Description</label>
                            <Textarea
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief summary for cards search results"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Features (One per line)</label>
                            <Textarea
                                rows={5}
                                value={featuresInput}
                                onChange={e => setFeaturesInput(e.target.value)}
                                placeholder="- Waterproof&#10;- 5 year warranty"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Detailed Content</label>
                            <RichTextEditor
                                value={formData.content}
                                onChange={(content) => setFormData({ ...formData, content })}
                                placeholder="Full product details..."
                            />
                        </div>

                        <NonBlogSeoTemplatePanel
                          slug={formData.slug || ''}
                          onPromptChange={() => {}}
                          onBriefChange={(brief) => setAiBrief(brief)}
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                        <h2 className="font-semibold text-lg">Media</h2>

                        <div className="space-y-2">
                            <ImagePicker
                                label="Cover Image"
                                value={formData.cover_image}
                                onChange={(url) => setFormData({ ...formData, cover_image: url })}
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                        <h2 className="font-semibold text-lg">Publishing</h2>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Meta title</label>
                            <Input
                                value={formData.meta_title}
                                onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                                placeholder="50-60 characters"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Meta description</label>
                            <Textarea
                                rows={4}
                                value={formData.meta_description}
                                onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                                placeholder="140-155 characters"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="published"
                                checked={formData.is_published}
                                onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                            />
                            <label htmlFor="published" className="text-sm font-medium">Published</label>
                        </div>

                        <Button type="submit" disabled={saving} className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12">
                            {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                            Save Product
                        </Button>
                    </div>

                    <ContentQualityCard
                        payload={{
                            title: formData.name,
                            description: formData.description,
                            content: formData.content,
                            metaTitle: formData.meta_title,
                            metaDescription: formData.meta_description,
                            contentType: 'product',
                            entityId: isNew ? undefined : id,
                            entityTable: 'products'
                        }}
                        autoFixPayload={{
                            title: formData.name,
                            description: formData.description,
                            content: formData.content,
                            metaTitle: formData.meta_title,
                            metaDescription: formData.meta_description,
                            contentType: 'product',
                            aiBrief,
                            entityId: isNew ? undefined : id,
                            entityTable: 'products'
                        }}
                        onAutoFixApply={(next) => {
                            setFormData((prev) => ({
                                ...prev,
                                name: next.title || prev.name,
                                description: next.description || prev.description,
                                content: next.content || prev.content,
                                meta_title: next.meta_title || prev.meta_title,
                                meta_description: next.meta_description || prev.meta_description
                            }));
                        }}
                        autoAnalyzeSignal={qaSignal}
                    />
                </div>
            </form>
        </div>
    );
}
