import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session) redirect("/tasks");
  else redirect("/login");
}
