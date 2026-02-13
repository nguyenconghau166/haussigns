'use client';

import { useState } from 'react';
import { Upload, Sparkles, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';

interface ImagePickerProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
}

export default function ImagePicker({ value, onChange, label = "Select Image" }: ImagePickerProps) {
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [prompt, setPrompt] = useState('');

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.url) {
                onChange(data.url);
            } else {
                alert('Upload failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('Upload error');
        } finally {
            setUploading(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setGenerating(true);
        try {
            const res = await fetch('/api/ai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            const data = await res.json();
            if (data.url) {
                onChange(data.url);
            } else {
                alert('Generation failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('Generation error');
        } finally {
            setGenerating(false);
        }
    };

    const handleRemove = () => {
        onChange('');
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{label}</label>

            {value ? (
                <div className="relative aspect-video w-full max-w-md bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
                    <Image src={value} alt="Selected" fill className="object-cover" />
                    <button
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white text-slate-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded truncate max-w-[90%]">
                        {value}
                    </div>
                </div>
            ) : (
                <div className="border rounded-xl p-4 bg-slate-50">
                    <Tabs defaultValue="upload" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="upload">Upload</TabsTrigger>
                            <TabsTrigger value="generate">AI Generate</TabsTrigger>
                        </TabsList>

                        <TabsContent value="upload" className="space-y-4">
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-6 hover:bg-slate-100 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleUpload}
                                    disabled={uploading}
                                />
                                {uploading ? (
                                    <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                                ) : (
                                    <Upload className="h-8 w-8 text-slate-400" />
                                )}
                                <p className="mt-2 text-sm text-slate-500 font-medium">
                                    {uploading ? 'Uploading...' : 'Click or drop to upload'}
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="generate" className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    placeholder="Describe image (e.g. Modern signage for tech company)"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                />
                                <Button
                                    onClick={handleGenerate}
                                    disabled={generating || !prompt}
                                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-90"
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 mr-2" /> Generate & Use
                                        </>
                                    )}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
}
