import { createClient } from "@/lib/supabase/server";
import PromptCard from "@/components/PromptCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 20;

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", slug)
    .single();

  if (!category) return { title: "Category not found" };

  return {
    title: `${category.name} Prompts`,
    description: category.description ?? `Browse AI image prompts in the ${category.name} category.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const { data: prompts, count } = await supabase
    .from("prompts")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("category_id", category.id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to categories
      </Link>

      {/* Category header */}
      <div className="flex items-start gap-4 mb-10">
        <div className="text-5xl">{category.icon}</div>
        <div>
          <h1 className="text-3xl font-bold text-white">{category.name}</h1>
          {category.description && (
            <p className="text-zinc-400 mt-1">{category.description}</p>
          )}
          <p className="text-zinc-600 text-sm mt-2">
            {count ?? 0} prompt{count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Grid */}
      {prompts && prompts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} showCategory={false} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-zinc-600">
          <p className="text-lg">No prompts in this category yet.</p>
          <Link href="/submit" className="text-red-400 hover:underline text-sm mt-2 block">
            Add the first one →
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12">
          {page > 1 && (
            <Link
              href={`/category/${slug}?page=${page - 1}`}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
            >
              ← Previous
            </Link>
          )}
          <span className="text-sm text-zinc-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/category/${slug}?page=${page + 1}`}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
