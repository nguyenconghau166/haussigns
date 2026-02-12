'use client';

import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichEditor({ value, onChange, placeholder, className }: RichEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    // If containerRef is null, we can't initialize
    if (!containerRef.current) return;

    // Clear the container before initializing to remove any existing toolbar/editor
    // This fixes the issue where React Strict Mode double-invokes the effect
    containerRef.current.innerHTML = '';

    // Create a fresh div for the editor
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
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link', 'image', 'clean'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'align': [] }],
        ],
      },
    });

    // Set initial content
    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }

    // Handle text changes
    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      onChange(html === '<p><br></p>' ? '' : html);
    });

    quillRef.current = quill;

    // Cleanup function
    return () => {
      quillRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. from AI)
  useEffect(() => {
    if (quillRef.current) {
      const currentContent = quillRef.current.root.innerHTML;
      // Only update if content is significantly different to avoid cursor jumps
      if (value !== currentContent && value !== '<p><br></p>') {
          // If value is empty string, we should clear editor
          if (!value) {
            quillRef.current.setText('');
          } else {
            quillRef.current.clipboard.dangerouslyPasteHTML(value);
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
