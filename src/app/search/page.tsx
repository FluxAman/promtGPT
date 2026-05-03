import { createClient } from "@/lib/supabase/server";
import PromptCard from "@/components/PromptCard";
import SearchBar from "@/components/SearchBar";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  return {
    title: params.q ? `"${params.q}" — Search Results` : "Browse All Prompts",
    description: `Search results for AI image prompts${params.q ? ` matching "${params.q}"` : ""}.`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const { q: query = "", category, sort = "newest" } = params;

  const supabase = await createClient();

  // Fetch categories for filter sidebar
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .order("name");

  // Build prompts query
  let promptsQuery = supabase
    .from("prompts")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("is_approved", true)
    .limit(50);

  if (query) {
    promptsQuery = promptsQuery.or(
      `title.ilike.%${query}%,prompt_text.ilike.%${query}%`
    );
  }

  if (category) {
    const cat = categories?.find((c) => c.slug === category);
    if (cat) {
      promptsQuery = promptsQuery.eq("category_id", cat.id);
    }
  }

  if (sort === "most_copied") {
    promptsQuery = promptsQuery.order("copy_count", { ascending: false });
  } else {
    promptsQuery = promptsQuery.order("created_at", { ascending: false });
  }

  const { data: prompts, count } = await promptsQuery;

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="max-w-2xl mb-6">
          <SearchBar initialQuery={query} autoFocus={!query} />
        </div>

        {query && (
          <h1 className="text-2xl font-bold text-white mb-1">
            Results for{" "}
            <span className="text-red-400">&ldquo;{query}&rdquo;</span>
          </h1>
        )}
        {!query && (
          <h1 className="text-2xl font-bold text-white mb-1">Browse All Prompts</h1>
        )}
        <p className="text-zinc-500 text-sm">
          {count ?? 0} prompt{count !== 1 ? "s" : ""} found
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-56 shrink-0">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-semibold text-zinc-200">Filters</span>
            </div>

            {/* Category filters */}
            <div className="mb-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Category</p>
              <div className="space-y-1">
                <Link
                  href={`/search?q=${encodeURIComponent(query)}&sort=${sort}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full ${
                    !category
                      ? "bg-red-600/20 text-red-300 border border-red-500/30"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  All categories
                </Link>
                {categories?.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/search?q=${encodeURIComponent(query)}&category=${cat.slug}&sort=${sort}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full ${
                      category === cat.slug
                        ? "bg-red-600/20 text-red-300 border border-red-500/30"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Sort by</p>
              <div className="space-y-1">
                {[
                  { value: "newest", label: "Newest first" },
                  { value: "most_copied", label: "Most copied" },
                ].map((option) => (
                  <Link
                    key={option.value}
                    href={`/search?q=${encodeURIComponent(query)}${category ? `&category=${category}` : ""}&sort=${option.value}`}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      sort === option.value
                        ? "bg-red-600/20 text-red-300 border border-red-500/30"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    }`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {prompts && prompts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {prompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-zinc-600" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-300 mb-2">No prompts found</h2>
              <p className="text-zinc-500 max-w-sm mb-6">
                {query
                  ? `We couldn't find any prompts matching "${query}". Try a different search term.`
                  : "No prompts match your current filters."}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-xs text-zinc-600">Try:</span>
                {["portrait", "landscape", "ui design", "3d art"].map((s) => (
                  <Link
                    key={s}
                    href={`/search?q=${s}`}
                    className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs hover:bg-zinc-700 hover:text-white transition-colors"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
