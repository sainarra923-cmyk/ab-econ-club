import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Avatar, PostListItem } from "@/components/post-bits";
import { getOfficer, getPublishedPosts } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const officer = await getOfficer(slug);
  return { title: officer?.name ?? "Officer not found" };
}

export default async function OfficerPage({ params }: Props) {
  const { slug } = await params;
  const officer = await getOfficer(slug);
  if (!officer) notFound();
  const posts = await getPublishedPosts({ authorId: officer.id });

  return (
    <div className="pt-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar name={officer.name} src={officer.photo_url} size={120} />
        <div>
          <h1 className="headline text-[2.4rem] sm:text-[3rem]">{officer.name}</h1>
          <p className="mt-1 text-[1.0625rem]">
            {officer.title && <span className="font-medium text-accent-ink">{officer.title}</span>}
            {officer.title && officer.grade && <span className="text-slate">, </span>}
            {officer.grade && <span className="text-slate">{officer.grade}</span>}
          </p>
        </div>
      </div>
      {officer.bio && <p className="mt-6 max-w-[60ch] font-serif text-[1.2rem] leading-[1.6]">{officer.bio}</p>}

      <section aria-labelledby="posts-heading" className="mt-14 max-w-3xl">
        <h2 id="posts-heading" className="border-b-2 border-ink pb-2 font-serif text-[1.25rem] font-semibold">
          Posts
        </h2>
        {posts.length ? (
          posts.map((p) => <PostListItem key={p.id} post={p} />)
        ) : (
          <p className="py-6 text-slate">No posts yet.</p>
        )}
      </section>
    </div>
  );
}
