"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, ImageIcon, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import type { Category, Prompt } from "@/types";
import Link from "next/link";

interface EditPromptFormProps {
  prompt: Prompt;
  categories: Category[];
}

export default function EditPromptForm({ prompt, categories }: EditPromptFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [title, setTitle] = useState(prompt.title);
  const [categoryId, setCategoryId] = useState(prompt.category_id || "");
  const [tags, setTags] = useState(prompt.tags?.join(", ") || "");
  const [promptText, setPromptText] = useState(prompt.prompt_text);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(prompt.image_url);

  // Crop/Position state
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalSrc, setOriginalSrc] = useState<string | null>(prompt.image_url);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number } | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const router = useRouter();

  const viewportRefCallback = (node: HTMLDivElement | null) => {
    (viewportRef as any).current = node;
    if (node) {
      setViewportSize({
        width: node.clientWidth,
        height: node.clientHeight,
      });
    }
  };

  useEffect(() => {
    if (dimensions.width > 0 && viewportSize) {
      const imgRatio = dimensions.width / dimensions.height;
      const vRatio = viewportSize.width / viewportSize.height || 4/3;
      
      let baseW = 0;
      let baseH = 0;
      if (imgRatio > vRatio) {
        baseH = viewportSize.height;
        baseW = viewportSize.height * imgRatio;
      } else {
        baseW = viewportSize.width;
        baseH = viewportSize.width / imgRatio;
      }
      
      setPosition({
        x: (viewportSize.width - baseW) / 2,
        y: (viewportSize.height - baseH) / 2,
      });
    }
  }, [dimensions, viewportSize]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginalFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setOriginalSrc(reader.result as string);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setDimensions({ width: 0, height: 0 });
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleAdjustClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (originalSrc) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setDimensions({ width: 0, height: 0 });
      setCropModalOpen(true);
    }
  };

  const handleCancelCrop = () => {
    setCropModalOpen(false);
    if (!imagePreview) {
      setOriginalFile(null);
      setOriginalSrc(null);
    }
  };

  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const handleStart = (clientX: number, clientY: number) => {
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!dragStart || !viewportSize || !imgRef.current) return;
    
    const vW = viewportSize.width;
    const vH = viewportSize.height;
    
    const imgRatio = dimensions.width / dimensions.height;
    const vRatio = vW / vH || 4/3;
    
    let baseW = 0;
    let baseH = 0;
    if (imgRatio > vRatio) {
      baseH = vH;
      baseW = vH * imgRatio;
    } else {
      baseW = vW;
      baseH = vW / imgRatio;
    }
    
    const currentW = baseW * zoom;
    const currentH = baseH * zoom;
    
    const desiredX = clientX - dragStart.x;
    const desiredY = clientY - dragStart.y;
    
    const minX = vW - currentW;
    const minY = vH - currentH;
    
    const clampedX = Math.min(0, Math.max(minX, desiredX));
    const clampedY = Math.min(0, Math.max(minY, desiredY));
    
    setPosition({ x: clampedX, y: clampedY });
  };

  const handleEnd = () => {
    setDragStart(null);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    if (!viewportSize || dimensions.width === 0) return;
    
    const vW = viewportSize.width;
    const vH = viewportSize.height;
    
    const imgRatio = dimensions.width / dimensions.height;
    const vRatio = vW / vH || 4/3;
    
    let baseW = 0;
    let baseH = 0;
    if (imgRatio > vRatio) {
      baseH = vH;
      baseW = vH * imgRatio;
    } else {
      baseW = vW;
      baseH = vW / imgRatio;
    }
    
    const currentW = baseW * newZoom;
    const currentH = baseH * newZoom;
    
    const minX = vW - currentW;
    const minY = vH - currentH;
    
    setPosition((prev) => ({
      x: Math.min(0, Math.max(minX, prev.x)),
      y: Math.min(0, Math.max(minY, prev.y)),
    }));
  };

  const handleApplyCrop = () => {
    if (!viewportSize || !imgRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 900;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const vW = viewportSize.width;
    const vH = viewportSize.height;
    
    const imgRatio = dimensions.width / dimensions.height;
    const vRatio = vW / vH || 4/3;
    
    let baseW = 0;
    let baseH = 0;
    if (imgRatio > vRatio) {
      baseH = vH;
      baseW = vH * imgRatio;
    } else {
      baseW = vW;
      baseH = vW / imgRatio;
    }
    
    const currentW = baseW * zoom;
    const currentH = baseH * zoom;
    
    const factor = 1200 / vW;
    
    ctx.clearRect(0, 0, 1200, 900);
    ctx.drawImage(
      imgRef.current,
      position.x * factor,
      position.y * factor,
      currentW * factor,
      currentH * factor
    );
    
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const name = originalFile?.name || "image.jpg";
          const type = originalFile?.type || "image/jpeg";
          const croppedFile = new File([blob], name, { type });
          setImageFile(croppedFile);
          setImagePreview(URL.createObjectURL(croppedFile));
          setCropModalOpen(false);
        }
      },
      originalFile?.type || "image/jpeg",
      0.95
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId || !promptText || !imagePreview) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = prompt.image_url;

      // 1. Upload new image if it was changed
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || "Image upload failed");
        }
        const data = await uploadRes.json();
        imageUrl = data.url;
      }

      // 2. Update prompt in Supabase
      const supabase = createClient();
      const { error } = await supabase
        .from("prompts")
        .update({
          title,
          prompt_text: promptText,
          image_url: imageUrl,
          category_id: categoryId,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          is_approved: true, // Keep it approved
        })
        .eq("id", prompt.id);

      if (error) throw new Error(error.message);

      toast.success("Prompt updated successfully! 🎉");
      router.push("/profile?tab=submissions");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Update failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const vWidth = viewportSize?.width ?? 0;
  const vHeight = viewportSize?.height ?? 0;
  const vRatio = vWidth / vHeight || 4/3;
  
  let baseWidth = 0;
  let baseHeight = 0;
  if (dimensions.width > 0 && vWidth > 0 && vHeight > 0) {
    const imgRatio = dimensions.width / dimensions.height;
    if (imgRatio > vRatio) {
      baseHeight = vHeight;
      baseWidth = vHeight * imgRatio;
    } else {
      baseWidth = vWidth;
      baseHeight = vWidth / imgRatio;
    }
  }
  
  const currentWidth = baseWidth * zoom;
  const currentHeight = baseHeight * zoom;

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <Link
          href="/profile?tab=submissions"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to submissions
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Prompt</h1>
        <p className="text-zinc-500 text-sm mt-1">Make adjustments to your prompt and sample photo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="image-upload">
            Sample Image <span className="text-red-400">*</span>
          </label>
          {imagePreview ? (
            <div className="relative flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-solid border-red-500/30 bg-zinc-900 overflow-hidden group/preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleAdjustClick}
                  className="px-4 py-2 bg-white text-zinc-900 font-semibold rounded-lg text-xs hover:bg-zinc-200 transition-colors"
                >
                  Adjust Crop
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById("image-upload")?.click()}
                  className="px-4 py-2 bg-zinc-800 text-white font-semibold rounded-lg text-xs hover:bg-zinc-700 transition-colors"
                >
                  Change Photo
                </button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed cursor-pointer transition-colors border-zinc-700 hover:border-zinc-500 bg-zinc-900/50"
            >
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <ImageIcon className="w-10 h-10 text-zinc-600" />
                <p className="text-sm text-zinc-500">
                  Click to upload image (JPG, PNG, WebP)
                </p>
              </div>
            </label>
          )}
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleImageChange}
            onClick={(e) => {
              (e.target as HTMLInputElement).value = "";
            }}
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="prompt-title">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            id="prompt-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cyberpunk cityscape at night"
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="category-select">
            Category <span className="text-red-400">*</span>
          </label>
          <select
            id="category-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-red-500 transition-colors text-sm"
            required
          >
            <option value="" disabled>Select a category…</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="tags-input">
            Tags <span className="text-zinc-600 text-xs font-normal">(comma-separated)</span>
          </label>
          <input
            id="tags-input"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. neon, futuristic, city, night"
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
          />
        </div>

        {/* Prompt text */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="prompt-text">
            Prompt Text <span className="text-red-400">*</span>
          </label>
          <textarea
            id="prompt-text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={8}
            placeholder="Enter the full AI image prompt text here…"
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm font-mono resize-y leading-relaxed"
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="submit-upload-btn"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white font-medium transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Changes…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting || submitting}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-zinc-900 hover:bg-red-600/10 border border-zinc-700 hover:border-red-500/30 text-zinc-400 hover:text-red-400 disabled:opacity-50 font-medium transition-all"
        >
          {deleting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Deleting…
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Delete Prompt
            </>
          )}
        </button>
      </form>

      {/* Crop Modal */}
      {cropModalOpen && originalSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-bold text-white">Adjust Your Photo</h3>
              <p className="text-zinc-500 text-xs mt-1">
                Drag the image to position it. Use the slider to zoom. The image will be cropped to a 4:3 ratio.
              </p>
            </div>

            {/* Viewport for cropping */}
            <div
              ref={viewportRefCallback}
              className="relative w-full aspect-[4/3] overflow-hidden bg-zinc-950 rounded-xl border border-zinc-800 cursor-move touch-none select-none"
              onMouseDown={(e) => {
                e.preventDefault();
                handleStart(e.clientX, e.clientY);
              }}
              onMouseMove={(e) => {
                e.preventDefault();
                handleMove(e.clientX, e.clientY);
              }}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                handleStart(touch.clientX, touch.clientY);
              }}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY);
              }}
              onTouchEnd={handleEnd}
            >
              {/* Image to crop */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={originalSrc}
                alt="Crop preview"
                onLoad={handleImageLoaded}
                crossOrigin="anonymous"
                style={{
                  position: "absolute",
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  width: `${currentWidth}px`,
                  height: `${currentHeight}px`,
                  maxWidth: "none",
                  maxHeight: "none",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Zoom Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-zinc-400">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={handleCancelCrop}
                className="px-4 py-2 text-zinc-400 hover:text-white font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Prompt</h3>
                <p className="text-zinc-500 text-xs">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              Are you sure you want to delete &ldquo;{prompt.title}&rdquo;? This will permanently remove the prompt and all associated saves.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const res = await fetch(`/api/prompts/${prompt.id}`, {
                      method: "DELETE",
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data.error || "Failed to delete prompt");
                    }
                    toast.success("Prompt deleted successfully!");
                    router.push("/profile?tab=submissions");
                    router.refresh();
                  } catch (err: unknown) {
                    toast.error((err as Error).message || "Delete failed. Please try again.");
                  } finally {
                    setDeleting(false);
                    setShowDeleteConfirm(false);
                  }
                }}
                disabled={deleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
