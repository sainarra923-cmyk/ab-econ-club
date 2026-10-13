import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { site } from "@/content/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 bg-band text-on-band">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-16">
        <div>
          <h2 className="headline text-[1.75rem] sm:text-[2rem]">Get new posts by email</h2>
          <p className="mt-2 max-w-md text-on-band-muted">
            One email when something new goes up. No spam, unsubscribe anytime.
          </p>
          <div className="mt-6">
            <NewsletterForm tone="band" />
          </div>
        </div>
        <div className="flex flex-col justify-between gap-8 md:items-end md:text-right">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm md:justify-end">
            <li><Link className="hover:underline" href="/blog">Blog</Link></li>
            <li><Link className="hover:underline" href="/events">Events</Link></li>
            <li><Link className="hover:underline" href="/officers">Officers</Link></li>
            <li><Link className="hover:underline" href="/resources">Resources</Link></li>
            <li><Link className="hover:underline" href="/about">About</Link></li>
          </ul>
          <div className="text-sm text-on-band-muted">
            <p>&copy; {year} {site.name}</p>
            {site.contactEmail && (
              <p>
                <a className="underline underline-offset-2" href={`mailto:${site.contactEmail}`}>
                  {site.contactEmail}
                </a>
              </p>
            )}
            <p className="mt-1">
              <Link href="/login" className="underline underline-offset-2">
                Officer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
