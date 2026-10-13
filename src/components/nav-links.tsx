"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/blog", label: "Blog" },
  { href: "/events", label: "Events" },
  { href: "/officers", label: "Officers" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main">
      <ul className="-mx-2 flex flex-wrap gap-x-1 gap-y-1 text-[0.9375rem] font-medium">
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`block px-2 py-1 transition-colors hover:text-accent-ink ${
                  active ? "text-ink underline decoration-accent decoration-2 underline-offset-[6px]" : "text-slate"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
