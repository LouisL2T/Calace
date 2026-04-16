"use client";

import { useRef, useState } from "react";
import { Camera, Upload, CheckCircle2, X, Loader2 } from "lucide-react";

interface PhotoCaptureProps {
  photoType: string;
  label: string;
  description?: string;
  required?: boolean;
  currentUrl?: string | null;
  onCapture: (photoType: string, file: File) => Promise<void>;
  icon?: React.ReactNode;
}

export default function PhotoCapture({
  photoType,
  label,
  description,
  required = false,
  currentUrl,
  onCapture,
  icon,
}: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    // Local preview
    const url = URL.createObjectURL(file);
    setPreview(url);
    setLoading(true);
    try {
      await onCapture(photoType, file);
    } catch {
      setError("Upload fehlgeschlagen. Bitte nochmal versuchen.");
      setPreview(currentUrl || null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const isDone = !!preview && !loading;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`w-full rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
          isDone
            ? "border-green-400 bg-green-50"
            : "border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
        }`}
        style={{ minHeight: "120px" }}
      >
        {preview ? (
          <div className="relative w-full h-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-cover"
            />
            {isDone && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-green-500 rounded-full p-1.5">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 size={24} className="text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              required ? "bg-orange-100" : "bg-gray-100"
            }`}>
              {icon || <Camera size={22} className={required ? "text-orange-500" : "text-gray-400"} />}
            </div>
            <div className="text-center">
              <p className={`text-sm font-medium ${required ? "text-orange-700" : "text-gray-600"}`}>
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </p>
              {description && (
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
              )}
              <p className="text-xs text-blue-500 mt-1 font-medium">Tippen zum Fotografieren</p>
            </div>
          </div>
        )}
      </button>

      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <X size={12} /> {error}
        </p>
      )}

      {isDone && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPreview(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50 transition-colors"
        >
          <X size={14} className="text-gray-500 hover:text-red-500" />
        </button>
      )}
    </div>
  );
}
