"use server";

import { marked } from "marked";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { emailLayout, escapeHtml, sendEmails, type OutgoingEmail } from "@/lib/email";
import { siteUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";

export type SendState = { error?: string; message?: string };

async function activeSubscribers() {
  const admin = createAdminClient();
  const all: { email: string; token: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("subscribers")
      .select("email, token")
      .is("unsubscribed_at", null)
      .order("created_at")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    all.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return all;
}

function personalize(subs: { email: string; token: string }[], subject: string, heading: string, bodyHtml: string, text: string) {
  const base = siteUrl();
  return subs.map<OutgoingEmail>((s) => {
    const unsubscribeUrl = `${base}/unsubscribe?token=${s.token}`;
    return {
      to: s.email,
      subject,
      html: emailLayout({ heading, bodyHtml, unsubscribeUrl, siteUrl: base }),
      text: `${text}\n\nUnsubscribe: ${unsubscribeUrl}`,
      headers: {
        "List-Unsubscribe": `<${base}/api/unsubscribe?token=${s.token}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
  });
}

export async function sendPostNewsletter(_prev: SendState, formData: FormData): Promise<SendState> {
  await requireAdmin();
  const postId = String(formData.get("post_id") ?? "");
  const admin = createAdminClient();
  const { data: post } = await admin
    .from("posts")
    .select("id, slug, title, excerpt, cover_url, status, author:profiles(name), byline")
    .eq("id", postId)
    .maybeSingle();
  if (!post || post.status !== "published") return { error: "Pick a published post." };

  const subs = await activeSubscribers();
  if (!subs.length) return { error: "There are no subscribers yet." };

  const url = `${siteUrl()}/blog/${post.slug}`;
  const authorName = post.byline ?? (post.author as { name?: string } | null)?.name;
  const bodyHtml = [
    post.cover_url ? `<p><img src="${post.cover_url}" alt="" style="width:100%;height:auto;"></p>` : "",
    post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : "",
    authorName ? `<p style="font-family:Arial,sans-serif;font-size:14px;color:#4b5a70;">By ${escapeHtml(authorName)}</p>` : "",
    `<p style="margin:24px 0;"><a href="${url}" style="background:#0e2340;color:#f5f7fa;padding:12px 18px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;border-radius:3px;">Read the post</a></p>`,
  ].join("");

  const { sent, error } = await sendEmails(personalize(subs, post.title, post.title, bodyHtml, `${post.title}\n\n${post.excerpt ?? ""}\n\nRead it: ${url}`));
  if (sent > 0) {
    await admin.from("posts").update({ emailed_at: new Date().toISOString() }).eq("id", post.id);
    await admin.from("newsletter_sends").insert({ subject: post.title, post_id: post.id, recipient_count: sent });
    revalidatePath("/admin/newsletter");
  }
  if (error) return { error: sent ? `Sent to ${sent}, then stopped: ${error}` : error };
  return { message: `Sent to ${sent} subscriber${sent === 1 ? "" : "s"}.` };
}

export async function sendCustomNewsletter(_prev: SendState, formData: FormData): Promise<SendState> {
  await requireAdmin();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject || !body) return { error: "Add a subject and a message." };

  const subs = await activeSubscribers();
  if (!subs.length) return { error: "There are no subscribers yet." };

  const html = await marked.parse(body, { async: true });
  const { sent, error } = await sendEmails(personalize(subs, subject, subject, html, body));
  if (sent > 0) {
    await createAdminClient().from("newsletter_sends").insert({ subject, recipient_count: sent });
    revalidatePath("/admin/newsletter");
  }
  if (error) return { error: sent ? `Sent to ${sent}, then stopped: ${error}` : error };
  return { message: `Sent to ${sent} subscriber${sent === 1 ? "" : "s"}.` };
}

export async function removeSubscriber(formData: FormData) {
  await requireAdmin();
  await createAdminClient().from("subscribers").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/admin/newsletter");
}
