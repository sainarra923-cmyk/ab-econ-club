import Link from "next/link";
import { Notice, PageTitle } from "@/components/admin/notice";
import { requireOfficer } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const officer = await requireOfficer();
  const { deleted } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, slug, title, status, published_at, updated_at, author_id, byline, author:profiles(name)")
    .order("updated_at", { ascending: false });
  const posts = (data ?? []) as unknown as (Pick<Post, "id" | "slug" | "title" | "status" | "published_at" | "updated_at" | "author_id" | "byline"> & {
    author: { name: string } | null;
  })[];

  const drafts = posts.filter((p) => p.status === "draft");
  const published = posts.filter((p) => p.status === "published");

  return (
    <>
      <PageTitle
        action={
          <Link href="/admin/posts/new" className="btn btn-primary">
            New post
          </Link>
        }
      >
        Posts
      </PageTitle>

      {deleted && <div className="mb-6"><Notice>Post deleted.</Notice></div>}

      <PostTable title="Drafts" empty="No drafts. Start one with New post." posts={drafts} officerId={officer.profile.id} isAdmin={officer.profile.is_admin} />
      <PostTable title="Published" empty="Nothing published yet." posts={published} officerId={officer.profile.id} isAdmin={officer.profile.is_admin} />
    </>
  );
}

function PostTable({
  title,
  empty,
  posts,
  officerId,
  isAdmin,
}: {
  title: string;
  empty: string;
  posts: (Pick<Post, "id" | "slug" | "title" | "status" | "published_at" | "updated_at" | "author_id" | "byline"> & { author: { name: string } | null })[];
  officerId: string;
  isAdmin: boolean;
}) {
  return (
    <section className="mb-10">
      <h2 className="border-b-2 border-ink pb-2 font-serif text-[1.25rem] font-semibold">
        {title} <span className="font-sans text-[0.875rem] font-normal text-muted">({posts.length})</span>
      </h2>
      {posts.length === 0 ? (
        <p className="py-5 text-slate">{empty}</p>
      ) : (
        <ul>
          {posts.map((p) => {
            const canEdit = isAdmin || p.author_id === officerId;
            return (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-rule py-4">
                <div className="min-w-0">
                  <p className="font-serif text-[1.15rem] font-semibold leading-snug">{p.title}</p>
                  <p className="text-[0.8125rem] text-slate">
                    {p.byline ?? p.author?.name ?? "No author"}
                    {", "}
                    {p.status === "published" ? `published ${formatDate(p.published_at)}` : `edited ${formatDate(p.updated_at)}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {p.status === "published" && (
                    <Link href={`/blog/${p.slug}`} className="btn btn-quiet" target="_blank">
                      View
                    </Link>
                  )}
                  <Link href={`/admin/posts/${p.id}`} className="btn btn-quiet">
                    {canEdit ? "Edit" : "Read"}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
