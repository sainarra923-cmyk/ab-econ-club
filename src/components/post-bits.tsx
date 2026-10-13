import Link from "next/link";
import { formatDate, readingMinutes } from "@/lib/format";
import type { Post } from "@/lib/types";

export function TagLinks({ tags, className = "" }: { tags: string[]; className?: string }) {
  if (!tags.length) return null;
  return (
    <ul className={`flex flex-wrap gap-x-3 gap-y-1 text-[0.8125rem] font-semibold ${className}`}>
      {tags.map((t) => (
        <li key={t}>
          <Link href={`/blog?tag=${encodeURIComponent(t)}`} className="text-accent-ink hover:underline">
            {t}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Byline({ post, withReadTime = false }: { post: Post; withReadTime?: boolean }) {
  return (
    <p className="text-[0.875rem] text-slate">
      {post.byline ? (
        <>
          By <span className="font-semibold text-ink">{post.byline}</span>
          {", "}
        </>
      ) : post.author ? (
        <>
          By{" "}
          <Link href={`/officers/${post.author.slug}`} className="font-semibold text-ink hover:underline">
            {post.author.name}
          </Link>
          {", "}
        </>
      ) : null}
      <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
      {withReadTime && <>{`, ${readingMinutes(post.body)} min read`}</>}
    </p>
  );
}

export function Avatar({ name, src, size = 56 }: { name: string; src: string | null; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="headline flex shrink-0 items-center justify-center rounded-full border border-accent text-accent-ink"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

/** Compact text-led list entry used on the home page, blog index, and officer pages. */
export function PostListItem({ post, showExcerpt = true }: { post: Post; showExcerpt?: boolean }) {
  return (
    <article className="border-t border-rule py-6 first-of-type:border-t-0">
      <TagLinks tags={post.tags} />
      <h3 className="headline mt-1.5 text-[1.45rem] sm:text-[1.6rem]">
        <Link href={`/blog/${post.slug}`} className="story-link">
          {post.title}
        </Link>
      </h3>
      {showExcerpt && post.excerpt && <p className="mt-2 max-w-[62ch] text-slate">{post.excerpt}</p>}
      <div className="mt-3">
        <Byline post={post} />
      </div>
    </article>
  );
}
