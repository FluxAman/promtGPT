import Link from "next/link";
import type { Category } from "@/types";
import { ArrowRight } from "lucide-react";

interface CategoryGridProps {
  categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
      role="list"
      aria-label="Prompt categories"
    >
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${category.slug}`}
          id={`category-card-${category.slug}`}
          role="listitem"
          className="block"
          aria-label={`Browse ${category.name} prompts`}
        >
          <div className="category-card glass-panel rounded-2xl p-5 h-full group cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300 origin-left">
                {category.icon || "🎨"}
              </div>
              <h3 className="text-sm font-semibold text-zinc-100 mb-1 group-hover:text-red-300 transition-colors">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-xs text-zinc-500 line-clamp-2 mb-4">
                  {category.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-auto pt-1">
                <span className="text-xs text-zinc-500 font-medium">
                  {category.prompt_count ?? 0} prompts
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
