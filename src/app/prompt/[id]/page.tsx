import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import CopyButton from "@/components/CopyButton";
import PromptCard from "@/components/PromptCard";
import SaveButton from "@/components/SaveButton";
import { ArrowLeft, Tag, Copy } from "lucide-react";

interface PromptPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PromptPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: prompt } = await supabase
    .from("prompts")
    .select("title, prompt_text, image_url")
    .eq("id", id)
    .single();

  if (!prompt) return { title: "Prompt not found" };

  return {
    title: prompt.title,
    description: prompt.prompt_text.slice(0, 155),
    openGraph: {
      title: prompt.title,
      description: prompt.prompt_text.slice(0, 155),
      images: prompt.image_url ? [{ url: prompt.image_url }] : [],
    },
  };
}

export default async function PromptDetailPage({ params }: PromptPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: prompt } = await supabase
    .from("prompts")
    .select("*, category:categories(*)")
    .eq("id", id)
    .single();

  if (!prompt) notFound();

  // Related prompts (same category, different id)
  const { data: related } = prompt.category_id
    ? await supabase
        .from("prompts")
        .select("*, category:categories(*)")
        .eq("category_id", prompt.category_id)
        .neq("id", id)
        .order("copy_count", { ascending: false })
        .limit(6)
    : { data: null };

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link
        href={prompt.category?.slug ? `/category/${prompt.category.slug}` : "/search"}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {prompt.category?.name ?? "Back"}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left — image */}
        <div className="lg:col-span-3">
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
            {prompt.image_url ? (
              <Image
                src={prompt.image_url}
                alt={prompt.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl">
                🎨
              </div>
            )}
          </div>
        </div>

        {/* Right — details */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Category badge */}
          {prompt.category && (
            <Link href={`/category/${prompt.category.slug}`}>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors">
                {prompt.category.icon} {prompt.category.name}
              </span>
            </Link>
          )}

          <h1 className="text-2xl font-bold text-white leading-tight">
            {prompt.title}
          </h1>

          {/* Copy count */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <Copy className="w-3 h-3" />
            {prompt.copy_count.toLocaleString()} copies
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <CopyButton promptId={prompt.id} promptText={prompt.prompt_text} />
            <SaveButton promptId={prompt.id} />
          </div>

          {/* Prompt text */}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-medium">Prompt Text</p>
            <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-4 group">
              <pre className="text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap break-words">
                {prompt.prompt_text}
              </pre>
            </div>
          </div>

          {/* Tags */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Tag className="w-3 h-3 text-zinc-500" />
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {prompt.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs hover:border-zinc-500 hover:text-white transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related prompts */}
      {related && related.length > 0 && (
        <section className="mt-16 border-t border-zinc-800 pt-12">
          <h2 className="text-xl font-bold text-white mb-6">
            More in {prompt.category?.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((p) => (
              <PromptCard key={p.id} prompt={p} showCategory={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
