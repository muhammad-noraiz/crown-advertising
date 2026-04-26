"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { uploadLocationImages, deleteLocationImage } from "@/actions/images";
import { getLocationImageUrl } from "@/lib/utils";
import type { LocationImage } from "@/lib/supabase/types";

interface Props {
  locationId: number;
  images: LocationImage[];
}

export function LocationImagesTab({ locationId, images }: Props) {
  const [uploading, startUpload] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
    setError(null);
    setSuccess(false);
  }

  function handleUpload() {
    if (!inputRef.current?.files?.length) return;
    const fd = new FormData();
    Array.from(inputRef.current.files).forEach((f) => fd.append("images", f));

    startUpload(async () => {
      setError(null);
      const err = await uploadLocationImages(locationId, fd);
      if (err) {
        setError(err);
      } else {
        setSuccess(true);
        setPreviews([]);
        formRef.current?.reset();
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  function handleDelete(image: LocationImage) {
    startDelete(async () => {
      await deleteLocationImage(image.id, image.storage_path, locationId);
    });
  }

  return (
    <div className="space-y-6">
      {/* Upload card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Upload Images</h3>

        <form ref={formRef}>
          {/* Drop zone */}
          <label
            htmlFor="img-upload"
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-8 cursor-pointer hover:border-amber-400 hover:bg-amber-50/40 transition-colors"
          >
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium text-slate-600">Click to select images</p>
            <p className="text-xs text-slate-400">PNG, JPG, WEBP — up to 10 MB each</p>
            <input
              id="img-upload"
              ref={inputRef}
              type="file"
              name="images"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>

          {/* Previews of selected files */}
          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <Image src={src} alt={`preview-${i}`} fill className="object-cover" sizes="200px" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Images uploaded successfully.</p>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || previews.length === 0}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold rounded-lg text-sm transition-colors"
          >
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Uploading…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                Upload {previews.length > 0 ? `${previews.length} image${previews.length > 1 ? "s" : ""}` : "Images"}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Gallery */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Gallery</h3>
          <span className="text-sm text-slate-400">{images.length} image{images.length !== 1 ? "s" : ""}</span>
        </div>

        {images.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No images yet. Upload some above.</div>
        ) : (
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img) => {
              const url = getLocationImageUrl(img.storage_path);
              return (
                <div
                  key={img.id}
                  className="group relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer"
                  onClick={() => setLightbox(url)}
                >
                  <Image
                    src={url}
                    alt={img.file_name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />

                  {/* Delete overlay */}
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={(e) => { e.stopPropagation(); handleDelete(img); }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/70 hover:bg-red-600 text-white rounded-full p-1.5"
                    title="Delete image"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* File name tooltip */}
                  <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-xs px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {img.file_name}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={() => setLightbox(null)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full">
            <Image
              src={lightbox}
              alt="full preview"
              fill
              className="object-contain"
              sizes="100vw"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
