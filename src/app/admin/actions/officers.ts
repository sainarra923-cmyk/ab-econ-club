"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { emailLayout, escapeHtml, sendEmails } from "@/lib/email";
import { isEmailConfigured, siteUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";

export type InviteState = { error?: string; message?: string; link?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function emailLink(to: string, heading: string, intro: string, link: string, button: string) {
  if (!isEmailConfigured) return false;
  const html = emailLayout({
    heading,
    siteUrl: siteUrl(),
    bodyHtml: `<p>${escapeHtml(intro)}</p><p style="margin:24px 0;"><a href="${link}" style="background:#0e2340;color:#f5f7fa;padding:12px 18px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;border-radius:3px;">${button}</a></p><p style="font-size:14px;color:#4b5a70;">This link works once and expires in 24 hours.</p>`,
  });
  const { error } = await sendEmails([{ to, subject: heading, html, text: `${intro}\n\n${link}` }]);
  return !error;
}

export async function inviteOfficer(_prev: InviteState, formData: FormData): Promise<InviteState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!name) return { error: "Add their name." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: { name, title } },
  });
  if (error) {
    if (/already.*registered|exists/i.test(error.message)) {
      return { error: "That email already has an account. Use \"Reset link\" next to their name instead." };
    }
    return { error: `Couldn't create the invite: ${error.message}` };
  }

  const link = `${siteUrl()}/auth/confirm?token_hash=${data.properties.hashed_token}&type=invite&next=${encodeURIComponent("/admin/account?setup=1")}`;
  const emailed = await emailLink(
    email,
    "You're invited to post on the AB Econ site",
    `${name}, you've been added as an officer on the Acton-Boxborough Economics Club website. Click below to set your password.`,
    link,
    "Set my password",
  );

  revalidatePath("/admin/officers");
  return {
    message: emailed
      ? `Invite emailed to ${email}. You can also send them this link yourself:`
      : `Invite created. Send ${name} this link (text or email it). It works once and expires in 24 hours:`,
    link,
  };
}

export async function makeResetLink(_prev: InviteState, formData: FormData): Promise<InviteState> {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const admin = createAdminClient();
  const { data: user, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !user.user?.email) return { error: "Couldn't find that login." };

  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email: user.user.email });
  if (error) return { error: error.message };
  const link = `${siteUrl()}/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery&next=${encodeURIComponent("/admin/account?setup=1")}`;
  return { message: `Send this to ${user.user.email} so they can set a new password. It works once and expires in 24 hours:`, link };
}

export async function updateOfficer(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      title: String(formData.get("title") ?? "").trim() || null,
      sort_order: Number(formData.get("sort_order") ?? 100) || 0,
      active: formData.get("active") === "on",
    })
    .eq("id", id);
  revalidatePath("/", "layout");
}

export async function removeOfficer(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id === me.profile.id) return;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("user_id").eq("id", id).maybeSingle();
  // Their posts stay up; the byline just drops off.
  await admin.from("profiles").delete().eq("id", id);
  if (profile?.user_id) await admin.auth.admin.deleteUser(profile.user_id);
  revalidatePath("/", "layout");
}
