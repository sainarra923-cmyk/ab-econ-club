import type { Metadata } from "next";
import Link from "next/link";
import { about, site } from "@/content/site";

export const metadata: Metadata = { title: "About", description: about.intro };

export default function AboutPage() {
  return (
    <div className="pt-10">
      <h1 className="headline text-[2.5rem] sm:text-[3.2rem]">About the club</h1>
      <p className="mt-5 max-w-[40ch] font-serif text-[1.45rem] leading-[1.45] sm:text-[1.6rem]">{about.intro}</p>
      <hr className="double-rule mt-10 max-w-3xl" />

      <div className="mt-4 max-w-3xl">
        {about.sections.map((s) => (
          <section key={s.heading} className="grid gap-2 border-b border-rule py-7 sm:grid-cols-[12rem_1fr] sm:gap-8">
            <h2 className="font-serif text-[1.25rem] font-semibold">{s.heading}</h2>
            <p className="max-w-[60ch]">{s.body}</p>
          </section>
        ))}
        <section className="grid gap-2 py-7 sm:grid-cols-[12rem_1fr] sm:gap-8">
          <h2 className="font-serif text-[1.25rem] font-semibold">When we meet</h2>
          <p className="max-w-[60ch]">
            {site.meeting}{" "}
            <Link href="/events" className="link">
              See upcoming events
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
