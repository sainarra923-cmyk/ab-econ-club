import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/post-bits";
import { getOfficers } from "@/lib/data";

export const metadata: Metadata = { title: "Officers", description: "The students who run the AB Economics Club." };

export default async function OfficersPage() {
  const officers = await getOfficers();
  return (
    <div className="pt-10">
      <h1 className="headline text-[2.5rem] sm:text-[3.2rem]">Officers</h1>
      <p className="mt-2 max-w-[56ch] text-slate">The students who run the club and edit the blog.</p>

      {officers.length ? (
        <ul className="mt-10 grid gap-x-10 border-t-2 border-ink sm:grid-cols-2 lg:grid-cols-3">
          {officers.map((o) => (
            <li key={o.id} className="border-b border-rule py-6">
              <Link href={`/officers/${o.slug}`} className="group flex items-start gap-4">
                <Avatar name={o.name} src={o.photo_url} size={72} />
                <div className="min-w-0">
                  <p className="font-serif text-[1.35rem] font-semibold leading-tight group-hover:underline">
                    {o.name}
                  </p>
                  {o.title && <p className="mt-0.5 font-medium text-accent-ink">{o.title}</p>}
                  {o.grade && <p className="text-[0.875rem] text-slate">{o.grade}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 border-t-2 border-ink pt-6 text-slate">Officer profiles are coming soon.</p>
      )}
    </div>
  );
}
