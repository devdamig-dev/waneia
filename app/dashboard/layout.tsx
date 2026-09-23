import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) redirect("/login");

  const { data: workspaces } = await supabase.from("workspaces").select("id").limit(1);
  if (!workspaces?.length) redirect("/onboarding");

  return <DashboardShell>{children}</DashboardShell>;
}
