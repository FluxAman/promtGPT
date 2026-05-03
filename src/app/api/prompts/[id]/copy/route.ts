import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Try RPC first (defined in schema.sql)
  const { error: rpcError } = await supabase.rpc("increment_copy_count", {
    prompt_id: id,
  });

  // Fallback: read then write
  if (rpcError) {
    const { data: prompt } = await supabase
      .from("prompts")
      .select("copy_count")
      .eq("id", id)
      .single();

    if (prompt) {
      await supabase
        .from("prompts")
        .update({ copy_count: (prompt.copy_count ?? 0) + 1 })
        .eq("id", id);
    }
  }

  return NextResponse.json({ success: true });
}
