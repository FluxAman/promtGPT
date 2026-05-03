import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = await createClient();

  let query = supabase
    .from("prompts")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();

    if (category) {
      query = query.eq("category_id", category.id);
    }
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prompts: data, count, page, limit });
}
