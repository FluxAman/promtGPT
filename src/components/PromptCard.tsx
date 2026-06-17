"use client";

import Image from "next/image";
import Link from "next/link";
import type { Prompt } from "@/types";
import { Copy, Trash2, Pencil, Loader2 } from "lucide-react";
import CopyButton from "./CopyButton";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PromptCardProps {
  prompt: Prompt;
  showCategory?: boolean;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
}

export default function PromptCard({
  prompt,
  showCategory = true,
  showEditButton = false,
  showDeleteButton = false,
}: PromptCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
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
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Delete failed. Please try again.");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Link
        href={`/prompt/${prompt.id}`}
        id={`prompt-card-${prompt.id}`}
        className="block group"
        aria-label={`View prompt: ${prompt.title}`}
      >
        <div className="prompt-card glass-panel rounded-2xl overflow-hidden cursor-pointer relative">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-zinc-800">
            {prompt.image_url ? (
              <Image
                src={prompt.image_url}
                alt={prompt.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                <span className="text-4xl">🎨</span>
              </div>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#030014] via-transparent to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
          </div>

          {/* Body */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-zinc-100 mb-1 line-clamp-1">
              {prompt.title}
            </h3>

            {showCategory && prompt.category && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-2">
                {prompt.category.icon} {prompt.category.name}
              </span>
            )}

            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
              {prompt.prompt_text.slice(0, 100)}
              {prompt.prompt_text.length > 100 ? "…" : ""}
            </p>
          </div>

          {/* Footer */}
          <div className="px-4 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
              <Copy className="w-3.5 h-3.5" />
              <span>{prompt.copy_count.toLocaleString()} copies</span>
            </div>
            <div className="flex items-center gap-2">
              {showEditButton && (
                <Link
                  href={`/prompt/${prompt.id}/edit`}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors relative z-10"
                >
                  <span className="flex items-center gap-1.5">
                    <Pencil className="w-3 h-3" />
                    Edit
                  </span>
                </Link>
              )}
              {showDeleteButton && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowConfirm(true);
                  }}
                  disabled={deleting}
                  className="px-3 py-1 bg-zinc-800 hover:bg-red-600/20 hover:text-red-400 border border-zinc-700 hover:border-red-500/30 text-zinc-400 text-xs font-semibold rounded-lg transition-colors relative z-10"
                >
                  <span className="flex items-center gap-1.5">
                    {deleting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    Delete
                  </span>
                </button>
              )}
              <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <CopyButton
                  promptId={prompt.id}
                  promptText={prompt.prompt_text}
                  variant="icon"
                />
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
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
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
    </>
  );
}
