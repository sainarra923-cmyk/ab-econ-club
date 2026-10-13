"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="-mb-px overflow-x-auto">
      <ul className="flex gap-1 text-[0.9375rem] font-medium">
        {links.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/posts") : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap border-b-2 px-3 py-2.5 ${
                  active ? "border-gold text-ink" : "border-transparent text-slate hover:text-ink"
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
