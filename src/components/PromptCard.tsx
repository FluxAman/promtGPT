import Image from "next/image";
import Link from "next/link";
import type { Prompt } from "@/types";
import { Copy } from "lucide-react";
import CopyButton from "./CopyButton";

interface PromptCardProps {
  prompt: Prompt;
  showCategory?: boolean;
}

export default function PromptCard({ prompt, showCategory = true }: PromptCardProps) {
  return (
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
          <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <CopyButton
              promptId={prompt.id}
              promptText={prompt.prompt_text}
              variant="icon"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
