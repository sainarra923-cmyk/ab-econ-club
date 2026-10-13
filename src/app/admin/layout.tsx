import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireOfficer } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const officer = await requireOfficer();
  const links = [
    { href: "/admin", label: "Posts" },
    { href: "/admin/events", label: "Events" },
    { href: "/admin/account", label: "My profile" },
    ...(officer.profile.is_admin
      ? [
          { href: "/admin/officers", label: "Officers" },
          { href: "/admin/newsletter", label: "Newsletter" },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-3">
            <Link href="/admin" className="headline text-[1.35rem]">
              AB Econ
            </Link>
            <span className="text-[0.8125rem] text-slate">Officer admin</span>
          </div>
          <div className="flex items-center gap-4 text-[0.875rem]">
            <span className="hidden text-slate sm:inline">{officer.profile.name}</span>
            <Link href="/" className="text-accent-ink hover:underline">
              View site
            </Link>
            <form action={signOut}>
              <button className="text-slate hover:text-ink hover:underline">Log out</button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <AdminNav links={links} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
