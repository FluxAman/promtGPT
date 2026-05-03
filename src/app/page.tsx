import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import CategoryGrid from "@/components/CategoryGrid";
import PromptCard from "@/components/PromptCard";
import SearchBar from "@/components/SearchBar";
import { CategoryGridSkeleton, PromptGridSkeleton } from "@/components/LoadingSkeleton";
import type { Metadata } from "next";
import { Sparkles, TrendingUp, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "PromptGPT — AI Image Prompt Library",
  description: "Browse thousands of AI image prompts for Midjourney, DALL-E, and Stable Diffusion.",
};

async function CategoriesSection() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  // Get prompt counts per category
  const { data: counts } = await supabase
    .from("prompts")
    .select("category_id")
    .eq("is_approved", true);

  const countMap: Record<string, number> = {};
  counts?.forEach((p) => {
    if (p.category_id) {
      countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
    }
  });

  const categoriesWithCount = (categories || []).map((c) => ({
    ...c,
    prompt_count: countMap[c.id] || 0,
  }));

  return <CategoryGrid categories={categoriesWithCount} />;
}

async function FeaturedPromptsSection() {
  const supabase = await createClient();

  const { data: prompts } = await supabase
    .from("prompts")
    .select("*, category:categories(*)")
    .eq("is_approved", true)
    .eq("is_featured", true)
    .order("copy_count", { ascending: false })
    .limit(9);

  if (!prompts?.length) {
    return (
      <div className="text-center py-16 text-zinc-600">
        <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p>No featured prompts yet. Add some from the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="masonry-grid">
      {prompts.map((prompt) => (
        <div key={prompt.id} className="masonry-item">
          <PromptCard prompt={prompt} />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 pt-16 pb-20 sm:pt-24 overflow-hidden">
        {/* Dynamic Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          {/* Interactive Badge */}
          <div className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium mb-8 hover:bg-white/10 transition-colors cursor-default">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/20 to-rose-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Zap className="w-3.5 h-3.5 text-red-400 relative z-10" />
            <span className="relative z-10">10,000+ AI prompts ready to use</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 drop-shadow-sm leading-tight">
            Find the perfect{" "}
            <span className="gradient-text pb-1 block sm:inline">AI image prompt</span>
          </h1>
          <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto">
            Browse thousands of curated prompts for Midjourney, DALL·E, Stable
            Diffusion and more — organized by style, category, and popularity.
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <SearchBar className="w-full" />
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-8 mt-10 text-sm text-zinc-600">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-red-500" />
              <span>8 Categories</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <span>Updated daily</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-red-500" />
              <span>One-click copy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Prompts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Featured Prompts</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Hand-picked, high-quality prompts</p>
          </div>
        </div>
        <Suspense fallback={<PromptGridSkeleton count={9} />}>
          <FeaturedPromptsSection />
        </Suspense>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-800/60">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Browse by Category</h2>
            <p className="text-zinc-500 text-sm mt-1">Explore prompts organized by style and subject</p>
          </div>
        </div>
        <Suspense fallback={<CategoryGridSkeleton />}>
          <CategoriesSection />
        </Suspense>
      </section>

      {/* CTA footer */}
      <section className="border-t border-zinc-800/60 py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to create something amazing?
          </h2>
          <p className="text-zinc-400 mb-8">
            Sign in to save your favourite prompts and build your personal library.
          </p>
        </div>
      </section>
    </div>
  );
}
