import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type Officer = {
  userId: string;
  email: string | null;
  profile: Profile;
};

/** The signed-in officer, or null if signed out or not an active officer. */
export async function getOfficer(): Promise<Officer | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", claims.sub)
    .eq("active", true)
    .maybeSingle<Profile>();

  if (!profile) return null;
  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    profile,
  };
}

export async function requireOfficer(): Promise<Officer> {
  const officer = await getOfficer();
  if (!officer) redirect("/login?reason=not-officer");
  return officer;
}

export async function requireAdmin(): Promise<Officer> {
  const officer = await requireOfficer();
  if (!officer.profile.is_admin) redirect("/admin");
  return officer;
}
