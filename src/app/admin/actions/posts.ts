"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOfficer } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type PostFormState = { error?: string; message?: string };

function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const t = part.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out.slice(0, 8);
}

async function uniqueSlug(supabase: Awaited<ReturnType<typeof createClient>>, base: string, ignoreId?: string) {
  const root = base || "post";
  let candidate = root;
  for (let n = 2; n < 50; n++) {
    let q = supabase.from("posts").select("id").eq("slug", candidate);
    if (ignoreId) q = q.neq("id", ignoreId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
    candidate = `${root}-${n}`;
  }
  return `${root}-${Date.now()}`;
}

export async function savePost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const officer = await requireOfficer();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "") || undefined;
  const intent = String(formData.get("intent") ?? "draft") as "draft" | "publish" | "unpublish";
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const byline = String(formData.get("byline") ?? "").trim() || null;
  const coverUrl = String(formData.get("cover_url") ?? "").trim() || null;
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const slugInput = slugify(String(formData.get("slug") ?? ""));

  if (!title) return { error: "Add a title before saving." };
  if (intent === "publish" && body.trim().length < 20) return { error: "Write the post before publishing it." };

  let existing: { status: string; published_at: string | null; slug: string } | null = null;
  if (id) {
    const { data } = await supabase.from("posts").select("status, published_at, slug").eq("id", id).maybeSingle();
    if (!data) return { error: "This post no longer exists, or you can't edit it." };
    existing = data;
  }

  const slug = await uniqueSlug(supabase, slugInput || existing?.slug || slugify(title), id);

  let status = existing?.status ?? "draft";
  let publishedAt = existing?.published_at ?? null;
  if (intent === "publish") {
    status = "published";
    publishedAt = publishedAt ?? new Date().toISOString();
  } else if (intent === "unpublish") {
    status = "draft";
  }

  const row = { title, slug, body, excerpt, byline, cover_url: coverUrl, tags, status, published_at: publishedAt };

  let savedId = id;
  if (id) {
    const { data, error } = await supabase.from("posts").update(row).eq("id", id).select("id");
    if (error) return { error: `Couldn't save: ${error.message}` };
    if (!data?.length) return { error: "Only the author or the admin can edit this post." };
  } else {
    const { data, error } = await supabase
      .from("posts")
      .insert({ ...row, author_id: officer.profile.id })
      .select("id")
      .single();
    if (error) return { error: `Couldn't save: ${error.message}` };
    savedId = data.id;
  }

  revalidatePath("/", "layout");

  const done =
    intent === "publish"
      ? existing?.status === "published"
        ? "updated"
        : "published"
      : intent === "unpublish"
        ? "unpublished"
        : "saved";

  if (!id) redirect(`/admin/posts/${savedId}?done=${done}`);
  return {
    message:
      done === "published"
        ? "Published. It's live on the blog."
        : done === "updated"
          ? "Changes are live."
          : done === "unpublished"
            ? "Unpublished. The post is back to a draft and hidden from the site."
            : "Draft saved.",
  };
}

export async function deletePost(formData: FormData) {
  await requireOfficer();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("posts").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/admin?deleted=1");
}
