import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const { promptId, action } = await request.json();

    if (!promptId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Use Service Role Key to bypass RLS for administrative actions
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (action === "approve") {
      const { error } = await supabaseAdmin
        .from("prompts")
        .update({ is_approved: true })
        .eq("id", promptId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Prompt approved" });
    } else if (action === "reject") {
      const { error } = await supabaseAdmin
        .from("prompts")
        .delete()
        .eq("id", promptId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Prompt rejected and deleted" });
    }

  } catch (error: unknown) {
    console.error("Admin action error:", error);
    return NextResponse.json({ error: (error as Error).message || "Internal server error" }, { status: 500 });
  }
}
