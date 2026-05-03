"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyButtonProps {
  promptId: string;
  promptText: string;
  variant?: "icon" | "full";
}

export default function CopyButton({
  promptId,
  promptText,
  variant = "full",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      toast.success("Prompt copied!", {
        description: "Paste it into your favourite AI image generator.",
        duration: 3000,
      });

      // Increment copy count in background
      fetch(`/api/prompts/${promptId}/copy`, { method: "POST" }).catch(() => {});

      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy", { description: "Please try again." });
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleCopy}
        className={`p-2 rounded-lg transition-all duration-200 ${
          copied
            ? "bg-green-500/20 text-green-400"
            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
        }`}
        aria-label={copied ? "Copied!" : "Copy prompt"}
        title={copied ? "Copied!" : "Copy prompt"}
      >
        {copied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      id={`copy-btn-${promptId}`}
      onClick={handleCopy}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
        copied
          ? "bg-green-600 text-white"
          : "bg-red-600 hover:bg-red-500 text-white"
      }`}
      aria-label={copied ? "Prompt copied!" : "Copy prompt"}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy Prompt
        </>
      )}
    </button>
  );
}
