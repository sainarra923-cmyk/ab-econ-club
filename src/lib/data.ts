import "server-only";
import { connection } from "next/server";
import placeholder from "@/content/placeholder.json";
import { isSupabaseConfigured } from "@/lib/env";
import { easternDateFromNow, easternToIso } from "@/lib/format";
import { createPublicClient } from "@/lib/supabase/server";
import type { ClubEvent, Post, Profile } from "@/lib/types";

const POST_FIELDS = "*, author:profiles(name, slug, title, photo_url)";

// ---------- Placeholder content (shown until Supabase is connected) ----------

function demoOfficers(): Profile[] {
  return placeholder.officers.map((o) => ({
    id: o.slug,
    user_id: null,
    name: o.name,
    slug: o.slug,
    title: o.title,
    grade: o.grade,
    bio: o.bio,
    photo_url: null,
    is_admin: false,
    active: true,
    sort_order: o.sort_order,
  }));
}

function demoPosts(): Post[] {
  const officers = demoOfficers();
  return placeholder.posts.map((p) => {
    const author = officers.find((o) => o.slug === p.author) ?? null;
    const published = new Date(Date.now() - p.days_ago * 86400000).toISOString();
    return {
      id: p.slug,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      body: p.body,
      cover_url: null,
      tags: p.tags,
      status: "published",
      published_at: published,
      emailed_at: null,
      author_id: author?.id ?? null,
      byline: null,
      created_at: published,
      updated_at: published,
      author: author && {
        name: author.name,
        slug: author.slug,
        title: author.title,
        photo_url: author.photo_url,
      },
    };
  });
}

function demoEvents(): ClubEvent[] {
  return placeholder.events.map((e, i) => {
    const starts = easternToIso(easternDateFromNow(e.day_offset), e.start_time);
    const ends = new Date(new Date(starts).getTime() + e.duration_minutes * 60000).toISOString();
    return {
      id: `demo-${i}`,
      title: e.title,
      description: e.description,
      location: e.location,
      starts_at: starts,
      ends_at: ends,
      link: null,
    };
  });
}

// ---------- Posts ----------

export async function getPublishedPosts(
  opts: { tag?: string; authorId?: string; limit?: number } = {},
): Promise<Post[]> {
  await connection();
  if (!isSupabaseConfigured) {
    let posts = demoPosts();
    if (opts.tag) posts = posts.filter((p) => p.tags.includes(opts.tag!));
    if (opts.authorId) posts = posts.filter((p) => p.author_id === opts.authorId);
    return opts.limit ? posts.slice(0, opts.limit) : posts;
  }
  const supabase = createPublicClient();
  let query = supabase
    .from("posts")
    .select(POST_FIELDS)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (opts.tag) query = query.contains("tags", [opts.tag]);
  if (opts.authorId) query = query.eq("author_id", opts.authorId);
  if (opts.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load posts: ${error.message}`);
  return (data ?? []) as Post[];
}

export async function getPublishedPost(slug: string): Promise<Post | null> {
  await connection();
  if (!isSupabaseConfigured) return demoPosts().find((p) => p.slug === slug) ?? null;
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_FIELDS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load post: ${error.message}`);
  return (data as Post | null) ?? null;
}

export async function getTags(): Promise<string[]> {
  await connection();
  const posts = isSupabaseConfigured
    ? ((await createPublicClient().from("posts").select("tags").eq("status", "published")).data ?? [])
    : demoPosts();
  const counts = new Map<string, number>();
  for (const p of posts as { tags: string[] }[]) {
    for (const t of p.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
}

// ---------- Events ----------

export async function getEvents(): Promise<{ upcoming: ClubEvent[]; past: ClubEvent[] }> {
  await connection();
  let events: ClubEvent[];
  if (!isSupabaseConfigured) {
    events = demoEvents();
  } else {
    const { data, error } = await createPublicClient()
      .from("events")
      .select("*")
      .order("starts_at", { ascending: true });
    if (error) throw new Error(`Could not load events: ${error.message}`);
    events = (data ?? []) as ClubEvent[];
  }
  const now = Date.now();
  const isOver = (e: ClubEvent) => new Date(e.ends_at ?? e.starts_at).getTime() < now;
  return {
    upcoming: events.filter((e) => !isOver(e)),
    past: events.filter(isOver).reverse(),
  };
}

// ---------- Officers ----------

export async function getOfficers(): Promise<Profile[]> {
  await connection();
  if (!isSupabaseConfigured) return demoOfficers();
  const { data, error } = await createPublicClient()
    .from("profiles")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(`Could not load officers: ${error.message}`);
  return (data ?? []) as Profile[];
}

export async function getOfficer(slug: string): Promise<Profile | null> {
  await connection();
  if (!isSupabaseConfigured) return demoOfficers().find((o) => o.slug === slug) ?? null;
  const { data } = await createPublicClient()
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}
