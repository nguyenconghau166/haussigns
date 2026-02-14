'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, X, Check, Image as ImageIcon, Loader2, Crop as CropIcon, RectangleHorizontal, RectangleVertical, Square, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from 'react-responsive';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: number; // Default aspect ratio to start with
  maxWidth?: number; // Max output width in pixels (default 1920)
  label?: string;
  className?: string;
}

// Define available aspect ratios for the user to choose from
const ASPECT_RATIOS = [
  { label: 'Free', value: undefined, icon: Maximize },
  { label: '16:9', value: 16 / 9, icon: RectangleHorizontal },
  { label: '4:3', value: 4 / 3, icon: RectangleHorizontal },
  { label: '1:1', value: 1, icon: Square },
  { label: '2:3', value: 2 / 3, icon: RectangleVertical },
];

export default function ImageUploader({
  value,
  onChange,
  aspectRatio = 16 / 9,
  maxWidth = 1920,
  label = "Upload Image",
  className
}: ImageUploaderProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [currentAspect, setCurrentAspect] = useState<number | undefined>(aspectRatio);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use media query to adjust layout on mobile
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [fileType, setFileType] = useState<string>('image/jpeg'); // Default to jpeg

  // If the parent component changes the required aspect ratio, update our state
  useEffect(() => {
    setCurrentAspect(aspectRatio);
  }, [aspectRatio]);

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

  const MAX_BLOB_SIZE = 2 * 1024 * 1024; // 2 MB safety threshold

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    _mimeType: string = 'image/jpeg'
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // --- Scale down to maxWidth while preserving aspect ratio ---
    let outWidth = pixelCrop.width;
    let outHeight = pixelCrop.height;

    if (outWidth > maxWidth) {
      const scale = maxWidth / outWidth;
      outWidth = Math.round(outWidth * scale);
      outHeight = Math.round(outHeight * scale);
    }
    // Also cap height to maxWidth (for portrait crops)
    if (outHeight > maxWidth) {
      const scale = maxWidth / outHeight;
      outWidth = Math.round(outWidth * scale);
      outHeight = Math.round(outHeight * scale);
    }

    canvas.width = outWidth;
    canvas.height = outHeight;

    // Use high-quality image smoothing for the downscale
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outWidth,
      outHeight
    );

    // Always output JPEG for maximum compression
    const outputMime = 'image/jpeg';
    let quality = 0.80;

    // Encode and check size; re-encode at lower quality if needed
    const encode = (q: number): Promise<Blob> =>
      new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        }, outputMime, q);
      });

    let blob = await encode(quality);
    console.log(`Crop output: ${outWidth}x${outHeight}, quality=${quality}, size=${(blob.size / 1024).toFixed(0)} KB`);

    // Iterative quality reduction if still too large
    const qualitySteps = [0.65, 0.50, 0.35];
    for (const q of qualitySteps) {
      if (blob.size <= MAX_BLOB_SIZE) break;
      console.log(`Blob too large (${(blob.size / 1024).toFixed(0)} KB), re-encoding at quality=${q}`);
      blob = await encode(q);
    }

    return blob;
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setLoading(true);
    try {
      console.log('Cropping image with area:', croppedAreaPixels);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      if (!croppedBlob) throw new Error('Failed to create crop blob');

      const formData = new FormData();
      formData.append('file', croppedBlob, `image.jpeg`);

      console.log('Uploading cropped image...');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Upload failed: ${res.status} ${errText}`);
      }

      const data = await res.json();
      if (data.url) {
        console.log('Upload successful:', data.url);
        onChange(data.url);
        setIsCropping(false);
        setImageSrc(null);
      } else {
        throw new Error(data.error || 'Unknown error from upload API');
      }
    } catch (e: any) {
      console.error('Image Upload Error:', e);
      alert(`Error uploading image: ${e.message}`);
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
        /* Cropping Modal */
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-5xl shadow-2xl flex flex-col md:flex-row max-h-[90vh]">

            {/* Header for Mobile */}
            <div className="md:hidden p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <CropIcon className="h-5 w-5 text-amber-500" /> Crop
              </h3>
              <button onClick={() => setIsCropping(false)} className="p-2 hover:bg-slate-200 rounded-full">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Main Cropper Area */}
            <div className="relative flex-1 bg-slate-900 min-h-[50vh] md:min-h-0 order-2 md:order-1">
              <Cropper
                image={imageSrc!}
                crop={crop}
                zoom={zoom}
                aspect={currentAspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            {/* Sidebar Controls */}
            <div className="w-full md:w-80 bg-white border-l p-4 flex flex-col gap-6 overflow-y-auto order-3 md:order-2 shrink-0 z-10">
              {/* Header for Desktop */}
              <div className="hidden md:flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <CropIcon className="h-5 w-5 text-amber-500" /> Crop Image
                </h3>
                <button onClick={() => setIsCropping(false)} className="p-1 hover:bg-slate-200 rounded-full">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.label}
                      onClick={() => setCurrentAspect(ratio.value)}
                      className={cn(
                        "flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm border transition-all",
                        currentAspect === ratio.value
                          ? "border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500"
                          : "border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <ratio.icon className="w-4 h-4" />
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zoom Control */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Zoom</label>
                  <span className="text-xs text-slate-400">{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div className="mt-auto pt-4 space-y-2 border-t border-slate-100">
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full py-2.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-amber-200"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save & Upload
                </button>
                <button
                  onClick={() => setIsCropping(false)}
                  className="w-full py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
