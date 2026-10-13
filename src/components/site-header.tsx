import Link from "next/link";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start justify-between gap-4">
          <Link href="/" className="group block w-fit" aria-label="Acton-Boxborough Economics Club, home">
            <span className="block font-sans text-[0.8125rem] font-semibold tracking-[0.02em] text-slate">
              Acton-Boxborough
            </span>
            <span className="headline block text-[2.1rem] leading-none sm:text-[2.6rem]">
              Economics Club
            </span>
          </Link>
          {/* On phones the toggle sits up here, next to the club name */}
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NavLinks />
          {/* On wider screens it sits at the end of the menu */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </div>
      <hr className="double-rule mt-4" />
    </header>
  );
}
