import Link from "next/link";
import { PageTitle } from "@/components/admin/notice";
import { PostEditor } from "@/components/admin/post-editor";
import { requireOfficer } from "@/lib/auth";
import { getKnownTags } from "../tags";

export default async function NewPostPage() {
  const officer = await requireOfficer();
  const knownTags = await getKnownTags();
  return (
    <>
      <p className="mb-2 text-[0.875rem]">
        <Link href="/admin" className="text-gold-ink hover:underline">All posts</Link>
      </p>
      <PageTitle>New post</PageTitle>
      <PostEditor post={null} userId={officer.userId} knownTags={knownTags} canEdit />
    </>
  );
}
