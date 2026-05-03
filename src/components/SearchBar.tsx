"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  initialQuery?: string;
  className?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  initialQuery = "",
  className = "",
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    setIsNavigating(true);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setTimeout(() => setIsNavigating(false), 1000);
  }, [query, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <div
      className={`relative flex items-center w-full ${className}`}
    >
      <div
        className={`
          flex items-center w-full rounded-full px-4 py-3 gap-3
          bg-zinc-900 border transition-all duration-200
          ${isFocused
            ? "border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
            : "border-zinc-700 hover:border-zinc-600"
          }
        `}
      >
        {isNavigating ? (
          <Loader2 className="w-4 h-4 text-red-400 shrink-0 animate-spin" />
        ) : (
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
        )}
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search prompts, styles, categories..."
          autoFocus={autoFocus}
          className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
          aria-label="Search prompts"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {!query && (
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 bg-zinc-800 border border-zinc-700 rounded">
            ⌘K
          </kbd>
        )}
      </div>
      <button
        onClick={handleSearch}
        className="ml-3 shrink-0 px-5 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-full transition-colors duration-200 hidden sm:block"
        aria-label="Search"
      >
        Search
      </button>
    </div>
  );
}
