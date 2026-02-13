'use client';

import React, { useEffect, useRef } from 'react';
import 'quill/dist/quill.snow.css';

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichEditor({ value, onChange, placeholder, className }: RichEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Using any here as dynamic import of type can be tricky in this setup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quillRef = useRef<any | null>(null);

  useEffect(() => {
    // If containerRef is null, we can't initialize
    if (!containerRef.current) return;

    let isMounted = true;

    const initQuill = async () => {
      try {
        const { default: Quill } = await import('quill');

        if (!isMounted || !containerRef.current) return;

        // Clear the container before initializing to remove any existing toolbar/editor
        containerRef.current.innerHTML = '';

        const editorElement = document.createElement('div');
        containerRef.current.appendChild(editorElement);

        // Initialize Quill
        const quill = new Quill(editorElement, {
          theme: 'snow',
          placeholder: placeholder || 'Type something...',
          modules: {
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
              ['link', 'image', 'clean'],
              [{ 'color': [] }, { 'background': [] }],
              [{ 'align': [] }],
            ],
          },
        });

        quillRef.current = quill;

        // Set initial content
        if (value) {
          // Check if dangerouslyPasteHTML exists (v1) or clipboard is different
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (quill as any).clipboard.dangerouslyPasteHTML(value);
        }

        // Handle text changes
        quill.on('text-change', () => {
          if (!isMounted) return;
          const html = quill.root.innerHTML;
          onChange(html === '<p><br></p>' ? '' : html);
        });

      } catch (error) {
        console.error('Error importing Quill:', error);
      }
    };

    initQuill();

    // Cleanup function
    return () => {
      isMounted = false;
      quillRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      // Note: Quill doesn't have a specific destroy method in v1/v2 that we need to call generally, 
      // clearing innerHTML is usually enough.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Sync external value changes (e.g. from AI)
  useEffect(() => {
    if (quillRef.current) {
      // We need to be careful not to overwrite user's typing.
      // Usually simpler editors just check if values are different.
      const currentContent = quillRef.current.root.innerHTML;
      if (value !== currentContent && value !== '<p><br></p>') {
        if (!value) {
          quillRef.current.setText('');
        } else {
          // Only update if the sanitized content is different to avoid cursor jumps
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (quillRef.current as any).clipboard.dangerouslyPasteHTML(value);
        }
      }
    }
  }, [value]);

  return (
    <div className={`rich-editor-wrapper ${className || ''}`}>
      <style jsx global>{`
        .ql-container {
          font-family: inherit;
          font-size: 0.875rem;
          min-height: 200px;
        }
        .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border-color: #e2e8f0 !important;
          background-color: #f8fafc;
        }
        .ql-container.ql-snow {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          border-color: #e2e8f0 !important;
        }
        .ql-editor {
          min-height: 200px;
        }
      `}</style>
      <div ref={containerRef} className="bg-white" />
    </div>
  );
}
