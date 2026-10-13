import type { Metadata } from "next";
import { resources } from "@/content/site";

export const metadata: Metadata = {
  title: "Resources",
  description: "Economics competitions, data sources, and reading for members.",
};

export default function ResourcesPage() {
  return (
    <div className="pt-10">
      <h1 className="headline text-[2.5rem] sm:text-[3.2rem]">Resources</h1>
      <p className="mt-2 max-w-[56ch] text-slate">Competitions to enter and places to find data and explanations.</p>

      {resources.map((group) => (
        <section key={group.heading} className="mt-12 max-w-3xl">
          <h2 className="border-b-2 border-ink pb-2 font-serif text-[1.5rem] font-semibold">{group.heading}</h2>
          <p className="mt-3 text-slate">{group.intro}</p>
          <ul className="mt-2">
            {group.items.map((item) => (
              <li key={item.name} className="border-b border-rule py-5">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-serif text-[1.25rem] font-semibold story-link"
                >
                  {item.name}
                </a>
                <p className="mt-1 max-w-[62ch]">{item.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
