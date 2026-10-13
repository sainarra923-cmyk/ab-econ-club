"use server";

import { revalidatePath } from "next/cache";
import { requireOfficer } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type AccountState = { error?: string; message?: string };

export async function saveProfile(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const officer = await requireOfficer();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Your name can't be empty." };

  const supabase = await createClient();
  const update: Record<string, string | null> = {
    name,
    title: String(formData.get("title") ?? "").trim() || null,
    grade: String(formData.get("grade") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    photo_url: String(formData.get("photo_url") ?? "").trim() || null,
  };

  // Keep the profile web address in step with the name, if it's free.
  const wanted = slugify(name) || officer.profile.slug;
  if (wanted !== officer.profile.slug) {
    const { data: taken } = await supabase.from("profiles").select("id").eq("slug", wanted).maybeSingle();
    if (!taken) update.slug = wanted;
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", officer.profile.id);
  if (error) return { error: `Couldn't save: ${error.message}` };
  revalidatePath("/", "layout");
  return { message: "Profile saved." };
}

export async function changePassword(_prev: AccountState, formData: FormData): Promise<AccountState> {
  await requireOfficer();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { message: "Password set. Use it next time you log in." };
}
