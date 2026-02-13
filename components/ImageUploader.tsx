'use client';

import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, X, Check, Image as ImageIcon, Loader2, Crop as CropIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: number; // e.g., 16/9, 1, 4/3
  label?: string;
  className?: string;
}

export default function ImageUploader({
  value,
  onChange,
  aspectRatio = 16 / 9,
  label = "Upload Image",
  className
}: ImageUploaderProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileType, setFileType] = useState<string>('image/jpeg'); // Default to jpeg

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileType(file.type); // Store original file type
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setIsCropping(true);
        // Reset file input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
      reader.readAsDataURL(file);
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    mimeType: string = 'image/jpeg'
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, mimeType, 0.95);
    });
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setLoading(true);
    try {
      const mimeType = fileType === 'image/png' || fileType === 'image/webp' ? fileType : 'image/jpeg';
      const extension = mimeType.split('/')[1];

      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, mimeType);
      const formData = new FormData();
      formData.append('file', croppedBlob, `image.${extension}`);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        onChange(data.url);
        setIsCropping(false);
        setImageSrc(null);
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('Error uploading image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Remove
          </button>
        )}
      </div>

      {!isCropping ? (
        <div className="flex gap-4 items-start">
          {/* Preview Area */}
          <div className="relative w-32 h-20 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 group">
            {value ? (
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <ImageIcon className="h-8 w-8 opacity-50" />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-1">
            <div className="relative group">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-2 pb-3">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            {/* Direct URL Input Fallback */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-400">or paste URL:</span>
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 py-1 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-amber-500"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      ) : (
        /* Cropping Modal/Inline */
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <CropIcon className="h-5 w-5 text-amber-500" /> Crop Image
              </h3>
              <button onClick={() => setIsCropping(false)} className="p-2 hover:bg-slate-200 rounded-full">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="relative h-80 bg-slate-900 w-full">
              <Cropper
                image={imageSrc!}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-4 space-y-4 bg-white">
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-slate-500 w-12">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsCropping(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Crop & Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
