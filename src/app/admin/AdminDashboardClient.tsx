"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, X, ShieldAlert, Loader2 } from "lucide-react";
import type { Prompt } from "@/types";
import Image from "next/image";

export default function AdminDashboardClient({ initialPrompts }: { initialPrompts: Prompt[] }) {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (promptId: string, action: "approve" | "reject") => {
    setProcessingId(promptId);
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, action }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Action failed");
      }

      toast.success(`Prompt successfully ${action}ed`);
      
      // Remove the prompt from the pending list
      setPrompts((prev) => prev.filter((p) => p.id !== promptId));
    } catch (err: unknown) {
      toast.error((err as Error).message || "An error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Moderation Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Review and approve user-submitted prompts</p>
        </div>
      </div>

      {prompts.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
          <Check className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">All caught up!</h2>
          <p className="text-zinc-500">There are no pending prompts to review.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col md:flex-row">
              <div className="relative w-full md:w-64 h-48 md:h-auto shrink-0 bg-zinc-950">
                <Image
                  src={prompt.image_url}
                  alt={prompt.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{prompt.title}</h3>
                      <div className="text-xs text-red-400 mt-1 uppercase tracking-wider">
                        {prompt.category?.name || "Uncategorized"}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 mt-3 font-mono line-clamp-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
                    {prompt.prompt_text}
                  </p>
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {prompt.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-zinc-800/50">
                  <button
                    onClick={() => handleAction(prompt.id, "approve")}
                    disabled={processingId !== null}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    {processingId === prompt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(prompt.id, "reject")}
                    disabled={processingId !== null}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    {processingId === prompt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
