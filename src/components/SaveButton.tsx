"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SaveButtonProps {
  promptId: string;
}

export default function SaveButton({ promptId }: SaveButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);

      if (uid) {
        const { data: savedRow } = await supabase
          .from("saved_prompts")
          .select("id")
          .eq("user_id", uid)
          .eq("prompt_id", promptId)
          .single();
        setSaved(!!savedRow);
      }
      setLoading(false);
    });
  }, [promptId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Please sign in to save prompts");
      return;
    }

    const supabase = createClient();

    if (saved) {
      await supabase
        .from("saved_prompts")
        .delete()
        .eq("user_id", userId)
        .eq("prompt_id", promptId);
      setSaved(false);
      toast.success("Removed from saved prompts");
    } else {
      await supabase
        .from("saved_prompts")
        .insert({ user_id: userId, prompt_id: promptId });
      setSaved(true);
      toast.success("Saved to your collection! ❤️");
    }
  };

  if (loading) {
    return <div className="w-10 h-10 rounded-xl bg-zinc-800 animate-pulse" />;
  }

  return (
    <button
      id={`save-btn-${promptId}`}
      onClick={handleToggle}
      title={saved ? "Remove from saved" : "Save prompt"}
      aria-label={saved ? "Remove from saved" : "Save prompt"}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 border ${
        saved
          ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
      }`}
    >
      <Heart
        className={`w-4 h-4 transition-all ${saved ? "fill-rose-400 text-rose-400" : ""}`}
      />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
