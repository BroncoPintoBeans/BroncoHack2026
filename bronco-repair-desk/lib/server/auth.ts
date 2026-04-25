import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types";

export async function getUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email!,
    full_name: user.user_metadata?.full_name,
  };
}

// Use in Server Components/Actions that must have a logged-in user.
// Redirects to sign-in automatically if the session is missing.
export async function requireUser(): Promise<AppUser> {
  const user = await getUser();
  if (!user) redirect("/");
  return user;
}
