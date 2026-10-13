import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl pt-12">
      <h1 className="headline text-[2.4rem]">Page not found</h1>
      <p className="mt-4 text-slate">The link may be old, or the post was unpublished.</p>
      <p className="mt-6">
        <Link href="/blog" className="btn btn-primary">
          Go to the blog
        </Link>
      </p>
    </div>
  );
}
