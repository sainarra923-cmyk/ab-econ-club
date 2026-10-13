import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function RootNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        <div className="max-w-xl pt-12">
          <h1 className="headline text-[2.4rem]">Page not found</h1>
          <p className="mt-4 text-slate">Check the address, or head back to the blog.</p>
          <p className="mt-6">
            <Link href="/blog" className="btn btn-primary">
              Go to the blog
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
