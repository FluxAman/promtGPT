import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditPromptForm from "./EditPromptForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Prompt — PromptGPT",
};

interface EditPromptPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPromptPage({ params }: EditPromptPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch the prompt
  const { data: prompt } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", id)
    .single();

  if (!prompt) {
    notFound();
  }

  // Authorize: Only the creator of the prompt can edit it
  if (prompt.created_by !== user.id) {
    redirect(`/prompt/${id}`);
  }

  // Fetch all categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <EditPromptForm
      prompt={prompt}
      categories={categories || []}
    />
  );
}
