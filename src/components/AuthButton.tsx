"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { LogOut, User as UserIcon, ChevronDown, Mail, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push("/");
    router.refresh();
  };

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  if (loading) {
    return (
      <div className="w-32 h-9 rounded-full bg-zinc-800 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => openAuth("login")}
            className="text-sm font-medium text-zinc-300 hover:text-white px-3 py-2 transition-colors hidden sm:block"
          >
            Log in
          </button>
          <button
            onClick={() => openAuth("signup")}
            className="text-sm font-medium bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full transition-colors"
          >
            Sign up
          </button>
        </div>

        <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
          <DialogContent className="sm:max-w-[400px] bg-[#0a0a0a] border-zinc-800 text-white p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center mt-4 mb-1">
                {authMode === "login" ? "Welcome back" : "Create an account"}
              </DialogTitle>
              <p className="text-zinc-400 text-center text-sm mb-6">
                {authMode === "login"
                  ? "Sign in to save prompts and access your profile."
                  : "Join PromptGPT to build your personal prompt library."}
              </p>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSignIn}
                className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-600 text-white text-sm font-medium transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0a0a0a] px-2 text-zinc-500">Or continue with</span>
                </div>
              </div>

              <button
                disabled
                className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-500 text-sm font-medium cursor-not-allowed"
              >
                <Mail className="w-5 h-5" />
                Email (Coming Soon)
              </button>
            </div>
            <p className="text-center text-xs text-zinc-500 mt-6 mb-2">
              {authMode === "login" ? (
                <>Don&apos;t have an account? <button onClick={() => setAuthMode("signup")} className="text-red-400 hover:text-red-300 font-medium ml-1">Sign up</button></>
              ) : (
                <>Already have an account? <button onClick={() => setAuthMode("login")} className="text-red-400 hover:text-red-300 font-medium ml-1">Log in</button></>
              )}
            </p>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const name = user.user_metadata?.full_name || user.email;

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/submit"
        className="hidden sm:flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Submit
      </Link>
      
      <div className="relative">
        <button
          id="user-menu-btn"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-700 hover:border-zinc-500 bg-zinc-900 transition-colors"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name || "User avatar"}
              width={28}
              height={28}
              className="rounded-full"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="hidden md:block text-sm text-zinc-300 max-w-[120px] truncate">
            {name}
          </span>
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </button>

      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-xs text-zinc-500">Signed in as</p>
              <p className="text-sm text-zinc-200 font-medium truncate">{user.email}</p>
            </div>
            <button
              id="profile-link"
              onClick={() => { router.push("/profile"); setDropdownOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              My Profile
            </button>
            <button
              id="sign-out-btn"
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 transition-colors border-t border-zinc-800"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
