import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the prompt and verify ownership
    const { data: prompt, error: fetchError } = await supabase
      .from("prompts")
      .select("id, created_by")
      .eq("id", id)
      .single();

    if (fetchError || !prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    if (prompt.created_by !== user.id) {
      return NextResponse.json(
        { error: "Forbidden. You can only delete your own prompts." },
        { status: 403 }
      );
    }

    // Use Service Role Key to bypass RLS for deletion
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: deleteError } = await supabaseAdmin
      .from("prompts")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: "Prompt deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Delete prompt error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
