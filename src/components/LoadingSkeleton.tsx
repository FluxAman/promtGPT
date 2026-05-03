export function PromptCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Image skeleton */}
      <div className="aspect-[4/3] skeleton-shimmer" />
      {/* Body */}
      <div className="p-4 space-y-2">
        <div className="h-4 skeleton-shimmer rounded-md w-3/4" />
        <div className="h-3 skeleton-shimmer rounded-md w-1/3" />
        <div className="h-3 skeleton-shimmer rounded-md w-full" />
        <div className="h-3 skeleton-shimmer rounded-md w-5/6" />
      </div>
      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="h-3 skeleton-shimmer rounded-md w-16" />
        <div className="w-8 h-8 skeleton-shimmer rounded-lg" />
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="w-10 h-10 skeleton-shimmer rounded-xl mb-3" />
      <div className="h-4 skeleton-shimmer rounded-md w-2/3 mb-2" />
      <div className="h-3 skeleton-shimmer rounded-md w-full mb-1" />
      <div className="h-3 skeleton-shimmer rounded-md w-4/5" />
    </div>
  );
}

export function PromptGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PromptCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}
