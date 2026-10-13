import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isSupabaseConfigured } from "@/lib/env";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {!isSupabaseConfigured && (
        <p className="bg-gold px-4 py-1.5 text-center text-[0.8125rem] font-medium text-[#10213b]">
          Preview: this is placeholder content. Real posts show up once the database is connected.
        </p>
      )}
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">{children}</main>
      <SiteFooter />
    </>
  );
}
