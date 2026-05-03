import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata = {
  title: "Admin Dashboard — PromptGPT",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/");
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  if (!adminEmails.includes(user.email.toLowerCase())) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col text-center px-4">
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-zinc-500 max-w-md">
          You do not have permission to view the moderation dashboard. If you are the owner, make sure your email is listed in the ADMIN_EMAILS environment variable.
        </p>
      </div>
    );
  }

  // Fetch pending prompts using Service Role to ensure we get them even if RLS is strict
  // But standard supabase server client bypasses RLS? No, server client uses the user's session.
  // We can just query them since RLS is currently open for SELECT.
  const { data: pendingPrompts } = await supabase
    .from("prompts")
    .select("*, category:categories(*)")
    .eq("is_approved", false)
    .order("created_at", { ascending: false });

  return <AdminDashboardClient initialPrompts={pendingPrompts || []} />;
}
