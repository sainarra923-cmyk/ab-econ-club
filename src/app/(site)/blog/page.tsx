import type { Metadata } from "next";
import Link from "next/link";
import { PostListItem } from "@/components/post-bits";
import { getPublishedPosts, getTags } from "@/lib/data";

export const metadata: Metadata = {
  title: "Blog",
  description: "Writing on markets, policy, and everyday economics from members of the AB Economics Club.",
};

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const [posts, tags] = await Promise.all([getPublishedPosts({ tag }), getTags()]);

  return (
    <div className="pt-10">
      <h1 className="headline text-[2.5rem] sm:text-[3.2rem]">{tag ? tag : "Blog"}</h1>
      <p className="mt-2 max-w-[56ch] text-slate">
        {tag
          ? `Posts tagged ${tag}.`
          : "Explainers, arguments, and charts from club members."}
      </p>

      {tags.length > 0 && (
        <nav aria-label="Filter by topic" className="mt-6">
          <ul className="flex flex-wrap gap-2 text-[0.875rem]">
            <li>
              <TagChip href="/blog" active={!tag}>
                All
              </TagChip>
            </li>
            {tags.map((t) => (
              <li key={t}>
                <TagChip href={`/blog?tag=${encodeURIComponent(t)}`} active={t === tag}>
                  {t}
                </TagChip>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-8 max-w-3xl border-t-2 border-ink">
        {posts.length ? (
          posts.map((p) => <PostListItem key={p.id} post={p} />)
        ) : (
          <p className="py-8 text-slate">
            {tag ? (
              <>
                Nothing tagged {tag} yet.{" "}
                <Link href="/blog" className="link">
                  See all posts
                </Link>
              </>
            ) : (
              "No posts yet. Check back soon."
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function TagChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-block rounded-full border px-3 py-1 font-medium transition-colors ${
        active ? "border-ink bg-ink text-paper" : "border-rule text-slate hover:border-gold hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
