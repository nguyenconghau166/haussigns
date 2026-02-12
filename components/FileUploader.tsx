'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, Image as ImageIcon } from 'lucide-react';

interface FileUploaderProps {
  onUploadComplete: (url: string) => void;
  label?: string;
}

export default function FileUploader({ onUploadComplete, label = "Upload File" }: FileUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validation: No video
      if (file.type.startsWith('video/')) {
          alert('Video files are not allowed.');
          return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
          const res = await fetch('/api/upload', {
              method: 'POST',
              body: formData
          });
          const data = await res.json();
          if (data.url) {
              setFileUrl(data.url);
              setFileName(file.name);
              onUploadComplete(data.url);
          } else {
              alert('Upload failed');
          }
      } catch (err) {
          console.error(err);
          alert('Upload error');
      } finally {
          setLoading(false);
      }
    }
  };

  return (
    <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">{label}</label>
        
        {!fileUrl ? (
            <div className="relative">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-500"
                >
                    {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                    ) : (
                        <>
                            <Upload className="h-6 w-6 mb-1" />
                            <span className="text-xs">Click to upload design/reference (Images, PDF)</span>
                        </>
                    )}
                </button>
            </div>
        ) : (
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <FileText className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{fileName || 'Attached File'}</p>
                    <p className="text-[10px] text-green-600">Upload Complete</p>
                </div>
                <button 
                    type="button"
                    onClick={() => {
                        setFileUrl(null);
                        setFileName(null);
                        onUploadComplete('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        )}
    </div>
  );
}
