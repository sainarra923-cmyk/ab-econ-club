import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { Avatar, Byline, PostListItem, TagLinks } from "@/components/post-bits";
import { getPublishedPost, getPublishedPosts } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.cover_url ? [post.cover_url] : undefined,
      publishedTime: post.published_at ?? undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const more = (await getPublishedPosts({ limit: 4 })).filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <article className="pt-10">
      <header className="max-w-[46rem]">
        <TagLinks tags={post.tags} />
        <h1 className="headline mt-3 text-[2.4rem] sm:text-[3.2rem]">{post.title}</h1>
        {post.excerpt && (
          <p className="mt-4 font-serif text-[1.3rem] leading-[1.5] text-slate">{post.excerpt}</p>
        )}
        <div className="mt-6 flex items-center gap-3">
          {post.author && !post.byline && <Avatar name={post.author.name} src={post.author.photo_url} size={44} />}
          <Byline post={post} withReadTime />
        </div>
      </header>

      <hr className="double-rule mt-8 max-w-[46rem]" />

      {post.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_url} alt="" className="mt-8 w-full max-w-[52rem] border border-rule object-cover" />
      )}

      <div className="mt-8">
        <Markdown source={post.body} />
      </div>

      {post.author && !post.byline && (
        <aside className="mt-14 flex max-w-[46rem] items-start gap-4 border-t border-rule pt-6">
          <Avatar name={post.author.name} src={post.author.photo_url} size={56} />
          <div>
            <p className="font-semibold">
              <Link href={`/officers/${post.author.slug}`} className="hover:underline">
                {post.author.name}
              </Link>
            </p>
            {post.author.title && <p className="text-[0.9375rem] text-slate">{post.author.title}</p>}
            <p className="mt-1 text-[0.9375rem]">
              <Link href={`/officers/${post.author.slug}`} className="link">
                More from {post.author.name}
              </Link>
            </p>
          </div>
        </aside>
      )}

      {more.length > 0 && (
        <section aria-labelledby="more-heading" className="mt-16 max-w-3xl">
          <h2 id="more-heading" className="border-b-2 border-ink pb-2 font-serif text-[1.25rem] font-semibold">
            Keep reading
          </h2>
          {more.map((p) => (
            <PostListItem key={p.id} post={p} showExcerpt={false} />
          ))}
        </section>
      )}
    </article>
  );
}
