import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const categorySlug = searchParams.get("category");
  const sort = searchParams.get("sort") ?? "newest";

  if (!query.trim()) {
    return NextResponse.json({ prompts: [], count: 0 });
  }

  const supabase = await createClient();

  let promptsQuery = supabase
    .from("prompts")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("is_approved", true)
    .or(`title.ilike.%${query}%,prompt_text.ilike.%${query}%`)
    .limit(50);

  if (categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();

    if (category) {
      promptsQuery = promptsQuery.eq("category_id", category.id);
    }
  }

  if (sort === "most_copied") {
    promptsQuery = promptsQuery.order("copy_count", { ascending: false });
  } else {
    promptsQuery = promptsQuery.order("created_at", { ascending: false });
  }

  const { data, count, error } = await promptsQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prompts: data, count });
}
