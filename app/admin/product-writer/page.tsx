'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PenTool, Sparkles, Loader2, Copy, Check, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper components defined outside to prevent focus loss
const InputField = ({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
            placeholder={placeholder}
        />
    </div>
);

const TextareaField = ({ label, value, onChange, placeholder, rows = 4 }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, rows?: number }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none"
            placeholder={placeholder}
        />
    </div>
);

const SelectField = ({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: { value: string, label: string }[] }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

export default function ProductWriterPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const [formData, setFormData] = useState({
        productName: '',
        features: '',
        audience: '',
        tone: 'Professional',
        language: 'en',
        type: 'product' // 'product' | 'material'
    });

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerate = async () => {
        if (!formData.productName || !formData.features) return;

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/ai/product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setResult(data.data);
            } else {
                alert(data.error || 'Failed to generate');
            }
        } catch (error) {
            console.error(error);
            alert('Error generating content');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!result) return;
        const text = `# ${result.title}\n\n${result.short_description}\n\n## Features\n${result.features_list.map((f: string) => `- ${f}`).join('\n')}\n\n## Description\n${result.long_description}\n\n> ${result.call_to_action}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">AI Content Writer</h1>
                    <p className="text-slate-500 mt-1">Generate professional copies for Products & Materials</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Input Form */}
                <Card className="border-0 shadow-md h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PenTool className="h-5 w-5 text-amber-500" />
                            {formData.type === 'product' ? 'Product Details' : 'Material Details'}
                        </CardTitle>
                        <CardDescription>Enter details about what you're writing for</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Type Selector */}
                        <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                            <button
                                onClick={() => handleChange('type', 'product')}
                                className={cn(
                                    "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                    formData.type === 'product' ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Product
                            </button>
                            <button
                                onClick={() => handleChange('type', 'material')}
                                className={cn(
                                    "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                    formData.type === 'material' ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Material
                            </button>
                        </div>

                        <InputField
                            label={formData.type === 'product' ? "Product Name" : "Material Name"}
                            value={formData.productName}
                            onChange={(v) => handleChange('productName', v)}
                            placeholder={formData.type === 'product' ? "e.g. 3D Acrylic LED Signage" : "e.g. 3mm Cast Acrylic Sheet"}
                        />

                        <TextareaField
                            label={formData.type === 'product' ? "Key Features & Benefits" : "Technical Specs & Properties"}
                            value={formData.features}
                            onChange={(v) => handleChange('features', v)}
                            placeholder={formData.type === 'product' ? "- Weatherproof material\n- customized size" : "- UV Resistant\n- 92% Light transmission\n- Glossy finish"}
                            rows={6}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                label="Target Audience"
                                value={formData.audience}
                                onChange={(v) => handleChange('audience', v)}
                                placeholder="Business owners, restaurants..."
                            />
                            <SelectField
                                label="Language"
                                value={formData.language}
                                onChange={(v) => handleChange('language', v)}
                                options={[
                                    { value: 'en', label: 'English' },
                                    { value: 'tl', label: 'Tagalog' },
                                    { value: 'mix', label: 'Taglish (English + Tagalog)' },
                                ]}
                            />
                        </div>

                        <SelectField
                            label="Tone of Voice"
                            value={formData.tone}
                            onChange={(v) => handleChange('tone', v)}
                            options={[
                                { value: 'Professional', label: 'Professional & Corporate' },
                                { value: 'Luxury', label: 'Luxury & Premium' },
                                { value: 'Friendly', label: 'Friendly & Approachable' },
                                { value: 'Technical', label: 'Technical & Detailed' },
                            ]}
                        />

                        <button
                            onClick={handleGenerate}
                            disabled={loading || !formData.productName || !formData.features}
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                            {loading ? 'Generating...' : formData.type === 'product' ? 'Generate Product Copy' : 'Generate Material Info'}
                        </button>
                    </CardContent>
                </Card>

                {/* Output Display */}
                <div className="space-y-6">
                    {result ? (
                        <Card className="border-0 shadow-md bg-white overflow-hidden">
                            <div className="p-1 bg-gradient-to-r from-amber-500 via-orange-500 to-purple-500" />
                            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Generated Content</CardTitle>
                                    <CardDescription>Ready to copy & paste</CardDescription>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                                    title="Copy Markdown"
                                >
                                    {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                                </button>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6 max-h-[700px] overflow-y-auto">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Title</h3>
                                    <div className="text-xl font-bold text-slate-900">{result.title}</div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Short Description</h3>
                                    <p className="text-slate-600">{result.short_description}</p>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Features</h3>
                                    <ul className="space-y-2">
                                        {result.features_list?.map((feature: string, i: number) => (
                                            <li key={i} className="flex gap-2 text-sm text-slate-700">
                                                <span className="text-amber-500">•</span> {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Description</h3>
                                    <div className="prose prose-sm text-slate-600 whitespace-pre-wrap">
                                        {result.long_description}
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                    <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Call to Action</h3>
                                    <p className="text-amber-900 font-medium">{result.call_to_action}</p>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SEO Keywords</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {result.seo_keywords?.map((kw: string, i: number) => (
                                            <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">#{kw}</span>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                <PenTool className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-lg font-medium text-slate-500">Ready to write</p>
                            <p className="text-sm">Fill in the details on the left and click Generate</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
