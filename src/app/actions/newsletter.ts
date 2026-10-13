"use server";

import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";

export type SubscribeState = { status: "idle" | "ok" | "error"; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribe(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  // Bots fill in every field, people never see this one.
  if (formData.get("company")) return { status: "ok", message: "You're signed up." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { status: "error", message: "Enter a valid email address." };
  }
  if (!isSupabaseConfigured || !process.env.SUPABASE_SECRET_KEY) {
    return { status: "error", message: "Newsletter sign-up opens once the site is fully set up." };
  }

  const { error } = await createAdminClient()
    .from("subscribers")
    .upsert({ email, unsubscribed_at: null }, { onConflict: "email" });

  if (error) return { status: "error", message: "Couldn't sign you up. Try again in a minute." };
  return { status: "ok", message: "You're signed up. New posts will land in your inbox." };
}
