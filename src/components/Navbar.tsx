"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";
import AuthButton from "./AuthButton";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/search", label: "Browse" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/5 bg-background/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          id="navbar-logo"
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-red-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <Image 
              src="/logo.svg" 
              alt="PromptGPT Logo" 
              fill 
              className="object-cover" 
              priority 
            />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-white">Prompt</span>
            <span className="text-red-400">GPT</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                pathname === link.href 
                  ? "text-white bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop search bar */}
        <div className="hidden lg:block flex-1 max-w-md">
          <SearchBar />
        </div>

        {/* Right: search icon (mobile/tablet) + auth */}
        <div className="flex items-center gap-3">
          <button
            id="mobile-search-btn"
            onClick={() => setSearchOpen(!searchOpen)}
            className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Open search"
          >
            <Search className="w-5 h-5" />
          </button>
          <AuthButton />
          {/* Mobile hamburger */}
          <button
            id="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="lg:hidden px-4 py-3 border-t border-white/5 bg-background/95 backdrop-blur-xl">
          <SearchBar autoFocus />
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-6 py-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
