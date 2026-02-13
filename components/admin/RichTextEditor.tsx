'use client';

import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);

    useEffect(() => {
        if (containerRef.current && !quillRef.current) {
            const quill = new Quill(containerRef.current, {
                theme: 'snow',
                placeholder: placeholder || 'Type something...',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                    ]
                }
            });

            quill.on('text-change', () => {
                const html = quill.root.innerHTML;
                onChange(html === '<p><br></p>' ? '' : html);
            });

            quillRef.current = quill;

            // Set initial value
            if (value) {
                quill.root.innerHTML = value;
            }
        }
    }, []); // Run once on mount

    // Update content if value changes externally and is different from current content
    useEffect(() => {
        if (quillRef.current && value) {
            const currentContent = quillRef.current.root.innerHTML;
            if (value !== currentContent && value !== '<p><br></p>') {
                // Avoid updating if the difference is just Quill normalization
                // This is a naive check. For a robust solution, consider comparing text only 
                // or only updating if the editor is not focused.

                // Only update if not focused to prevent cursor jumps
                if (!containerRef.current?.contains(document.activeElement)) {
                    quillRef.current.root.innerHTML = value;
                }
            }
        }
    }, [value]);

    return (
        <div className={`rich-text-editor ${className}`}>
            <div ref={containerRef} className="bg-white rounded-lg min-h-[200px]" />
            <style jsx global>{`
                .ql-toolbar {
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    border-color: #e2e8f0;
                }
                .ql-container {
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    border-color: #e2e8f0;
                    min-height: 200px;
                    font-size: 1rem;
                }
                .ql-editor {
                    min-height: 200px;
                }
            `}</style>
        </div>
    );
}
