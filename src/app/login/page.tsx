import type { Metadata } from "next";
import Link from "next/link";
import { getOfficer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Officer login", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string; "signed-out"?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = params.next?.startsWith("/admin") ? params.next : "/admin";

  let signedInButNotOfficer = false;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub && !(await getOfficer())) signedInButNotOfficer = true;
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center">
          <span className="block text-[0.8125rem] font-semibold text-slate">Acton-Boxborough</span>
          <span className="headline block text-[2.2rem] leading-none">Economics Club</span>
        </Link>
        <hr className="double-rule mt-4" />
        <h1 className="mt-8 font-serif text-[1.5rem] font-semibold">Officer login</h1>

        {params["signed-out"] && <p role="status" className="mt-3 text-sm text-ok">You're logged out.</p>}
        {params.error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            That link is expired or was already used. Log in, or ask the admin for a new link.
          </p>
        )}

        {!isSupabaseConfigured ? (
          <p className="mt-4 text-slate">
            Logins work once the site is connected to Supabase. Follow the setup guide in the project README.
          </p>
        ) : signedInButNotOfficer ? (
          <div className="mt-4 space-y-4">
            <p className="text-slate">
              You're logged in, but this account isn't an active officer. Ask the club admin to invite you.
            </p>
            <form action={signOut}>
              <button className="btn btn-quiet w-full">Log out</button>
            </form>
          </div>
        ) : (
          <div className="mt-6">
            <LoginForm next={next} />
          </div>
        )}

        <p className="mt-10 text-center text-sm">
          <Link href="/" className="text-slate hover:underline">
            Back to the site
          </Link>
        </p>
      </div>
    </main>
  );
}
