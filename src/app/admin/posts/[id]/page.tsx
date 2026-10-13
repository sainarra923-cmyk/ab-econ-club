import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/admin/notice";
import { PostEditor } from "@/components/admin/post-editor";
import { requireOfficer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";
import { getKnownTags } from "../tags";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const officer = await requireOfficer();
  const [{ id }, { done }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const post = data as Post;
  const canEdit = officer.profile.is_admin || post.author_id === officer.profile.id;
  const knownTags = await getKnownTags();

  return (
    <>
      <p className="mb-2 text-[0.875rem]">
        <Link href="/admin" className="text-gold-ink hover:underline">All posts</Link>
      </p>
      <PageTitle>{post.status === "published" ? "Edit post" : "Edit draft"}</PageTitle>
      <PostEditor post={post} userId={officer.userId} knownTags={knownTags} canEdit={canEdit} justDid={done} />
    </>
  );
}
