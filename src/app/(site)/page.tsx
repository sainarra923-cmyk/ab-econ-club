import Link from "next/link";
import { EventRow } from "@/components/event-bits";
import { Byline, PostListItem, TagLinks } from "@/components/post-bits";
import { about } from "@/content/site";
import { getEvents, getPublishedPosts } from "@/lib/data";
import type { Post } from "@/lib/types";

export default async function HomePage() {
  const [posts, { upcoming }] = await Promise.all([getPublishedPosts({ limit: 5 }), getEvents()]);
  const [featured, ...rest] = posts;

  return (
    <>
      {featured ? <Featured post={featured} /> : <NoPostsYet />}

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16">
        <section aria-labelledby="latest-heading">
          <SectionHeading id="latest-heading" href="/blog" linkLabel="All posts">
            Latest
          </SectionHeading>
          {rest.length ? (
            rest.map((p) => <PostListItem key={p.id} post={p} />)
          ) : (
            <p className="border-t border-rule py-6 text-slate">More posts will show up here as officers publish them.</p>
          )}
        </section>

        <aside className="space-y-12">
          <section aria-labelledby="events-heading">
            <SectionHeading id="events-heading" href="/events" linkLabel="All events">
              Coming up
            </SectionHeading>
            {upcoming.length ? (
              upcoming.slice(0, 3).map((e) => <EventRow key={e.id} event={e} compact />)
            ) : (
              <p className="border-t border-rule py-4 text-slate">No events scheduled yet.</p>
            )}
          </section>

          <section aria-labelledby="about-heading" className="border-t-2 border-ink pt-4">
            <h2 id="about-heading" className="font-serif text-[1.25rem] font-semibold">
              About the club
            </h2>
            <p className="mt-2 text-slate">{about.intro}</p>
            <p className="mt-3">
              <Link href="/about" className="link font-medium">
                How the club works
              </Link>
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}

function Featured({ post }: { post: Post }) {
  return (
    <section aria-label="Featured post" className="pt-8 sm:pt-12">
      <div className={post.cover_url ? "grid gap-8 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:items-end" : ""}>
        <div>
          <TagLinks tags={post.tags} />
          <h1 className="headline mt-3 max-w-[18ch] text-[2.5rem] sm:text-[3.4rem] lg:text-[4.1rem]">
            <Link href={`/blog/${post.slug}`} className="story-link">
              {post.title}
            </Link>
          </h1>
        </div>
        {post.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_url}
            alt=""
            className="aspect-[4/3] w-full border border-rule object-cover"
          />
        )}
      </div>
      {post.excerpt && (
        <p className="mt-6 max-w-[52ch] font-serif text-[1.3rem] leading-[1.5] text-slate sm:text-[1.45rem]">
          {post.excerpt}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link href={`/blog/${post.slug}`} className="btn btn-primary">
          Read the post
        </Link>
        <Byline post={post} withReadTime />
      </div>
      <hr className="double-rule mt-10" />
    </section>
  );
}

function NoPostsYet() {
  return (
    <section className="pt-10">
      <h1 className="headline max-w-[20ch] text-[2.5rem] sm:text-[3.4rem]">
        The first post is on its way.
      </h1>
      <p className="mt-4 max-w-[50ch] text-slate">
        Officers can publish from the admin area. Sign up below to get it by email.
      </p>
      <hr className="double-rule mt-10" />
    </section>
  );
}

function SectionHeading({
  id,
  children,
  href,
  linkLabel,
}: {
  id: string;
  children: React.ReactNode;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-baseline justify-between border-b-2 border-ink pb-2">
      <h2 id={id} className="font-serif text-[1.25rem] font-semibold">
        {children}
      </h2>
      <Link href={href} className="text-[0.875rem] font-medium text-gold-ink hover:underline">
        {linkLabel}
      </Link>
    </div>
  );
}
