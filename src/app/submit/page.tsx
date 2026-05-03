"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, ImageIcon, Loader2 } from "lucide-react";
import type { Category } from "@/types";

export default function SubmitPromptPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [promptText, setPromptText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/"); return; }

      const email = data.user.email ?? "";
      setUser({ email });

      // Fetch categories
      const { data: cats } = await supabase.from("categories").select("*").order("name");
      setCategories(cats ?? []);
      setLoading(false);
    });
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId || !promptText || !imageFile) {
      toast.error("Please fill in all required fields and select an image.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Upload image to Cloudinary via API
      const formData = new FormData();
      formData.append("file", imageFile);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Image upload failed");
      }
      const { url: imageUrl } = await uploadRes.json();

      // 2. Insert prompt into Supabase
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("prompts").insert({
        title,
        prompt_text: promptText,
        image_url: imageUrl,
        category_id: categoryId,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        created_by: userData.user?.id,
      });

      if (error) throw new Error(error.message);

      toast.success("Prompt uploaded successfully! 🎉");
      // Reset form
      setTitle(""); setCategoryId(""); setTags(""); setPromptText("");
      setImageFile(null); setImagePreview(null);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Submit Prompt</h1>
        <p className="text-zinc-500 text-sm mt-1">Share your best AI image prompts with the community. Signed in as {user?.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="image-upload">
            Sample Image <span className="text-red-400">*</span>
          </label>
          <label
            htmlFor="image-upload"
            className={`flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
              imagePreview
                ? "border-red-500/50 bg-zinc-900"
                : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/50"
            }`}
          >
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <ImageIcon className="w-10 h-10 text-zinc-600" />
                <p className="text-sm text-zinc-500">
                  Click to upload image (JPG, PNG, WebP)
                </p>
              </div>
            )}
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleImageChange}
            />
          </label>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="prompt-title">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            id="prompt-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cyberpunk cityscape at night"
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="category-select">
            Category <span className="text-red-400">*</span>
          </label>
          <select
            id="category-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-red-500 transition-colors text-sm"
            required
          >
            <option value="" disabled>Select a category…</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="tags-input">
            Tags <span className="text-zinc-600 text-xs font-normal">(comma-separated)</span>
          </label>
          <input
            id="tags-input"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. neon, futuristic, city, night"
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
          />
        </div>

        {/* Prompt text */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="prompt-text">
            Prompt Text <span className="text-red-400">*</span>
          </label>
          <textarea
            id="prompt-text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={8}
            placeholder="Enter the full AI image prompt text here…"
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm font-mono resize-y leading-relaxed"
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="submit-upload-btn"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white font-medium transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Submit Prompt
            </>
          )}
        </button>
      </form>
    </div>
  );
}
