import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import PromptCard from "@/components/PromptCard";
import type { Metadata } from "next";
import { User, Bookmark, Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Your saved prompts and activity on PromptGPT.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch saved prompts with full prompt data
  const { data: savedPrompts } = await supabase
    .from("saved_prompts")
    .select("*, prompt:prompts(*, category:categories(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const avatarUrl = user.user_metadata?.avatar_url;
  const name = user.user_metadata?.full_name || user.email;

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 sm:px-6 py-12">
      {/* User info header */}
      <div className="flex items-center gap-5 mb-12">
        <div className="relative">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name || "User"}
              width={72}
              height={72}
              className="rounded-2xl border-2 border-zinc-700"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-2xl bg-red-600 flex items-center justify-center border-2 border-zinc-700">
              <User className="w-8 h-8 text-white" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{name}</h1>
          <p className="text-zinc-500 text-sm">{user.email}</p>
          <p className="text-zinc-600 text-xs mt-1">
            {savedPrompts?.length ?? 0} saved prompt{savedPrompts?.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 mb-8 gap-1">
        <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white border-b-2 border-red-500">
          <Bookmark className="w-4 h-4" />
          Saved Prompts
        </div>
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-500 cursor-not-allowed">
          <Activity className="w-4 h-4" />
          Activity
        </div>
      </div>

      {/* Saved prompts grid */}
      {savedPrompts && savedPrompts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedPrompts.map((sp) =>
            sp.prompt ? (
              <PromptCard key={sp.id} prompt={sp.prompt} />
            ) : null
          )}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8 text-zinc-600" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-300 mb-2">No saved prompts yet</h2>
          <p className="text-zinc-500 text-sm mb-6">
            Browse prompts and click the heart icon to save them here.
          </p>
          <a
            href="/search"
            className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
          >
            Browse prompts
          </a>
        </div>
      )}
    </div>
  );
}
