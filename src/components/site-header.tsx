import Link from "next/link";
import { NavLinks } from "@/components/nav-links";

export function SiteHeader() {
  return (
    <header className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <Link href="/" className="group block w-fit" aria-label="Acton-Boxborough Economics Club, home">
          <span className="block font-sans text-[0.8125rem] font-semibold tracking-[0.02em] text-slate">
            Acton-Boxborough
          </span>
          <span className="headline block text-[2.1rem] leading-none sm:text-[2.6rem]">
            Economics Club
          </span>
        </Link>
        <NavLinks />
      </div>
      <hr className="double-rule mt-4" />
    </header>
  );
}
