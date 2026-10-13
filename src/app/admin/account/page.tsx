import Link from "next/link";
import { PasswordForm, ProfileForm } from "@/components/admin/account-forms";
import { Notice, PageTitle } from "@/components/admin/notice";
import { requireOfficer } from "@/lib/auth";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ setup?: string }> }) {
  const officer = await requireOfficer();
  const { setup } = await searchParams;
  const isSetup = setup === "1";

  return (
    <>
      <PageTitle>{isSetup ? "Finish setting up" : "My profile"}</PageTitle>
      {isSetup && (
        <div className="mb-8 max-w-3xl">
          <Notice tone="info">
            Set a password first, so you can log in next time. Then fill in your profile; it shows on the{" "}
            <Link href="/officers" className="link">Officers page</Link> and on your posts.
          </Notice>
        </div>
      )}

      <div className="grid max-w-3xl gap-12">
        {isSetup && (
          <section>
            <h2 className="mb-5 border-b-2 border-ink pb-2 font-serif text-[1.25rem] font-semibold">Password</h2>
            <PasswordForm setup />
          </section>
        )}

        <section>
          <div className="mb-5 flex items-baseline justify-between border-b-2 border-ink pb-2">
            <h2 className="font-serif text-[1.25rem] font-semibold">Profile</h2>
            <Link href={`/officers/${officer.profile.slug}`} className="text-[0.875rem] text-accent-ink hover:underline" target="_blank">
              View public profile
            </Link>
          </div>
          <ProfileForm profile={officer.profile} userId={officer.userId} />
        </section>

        {!isSetup && (
          <section>
            <h2 className="mb-5 border-b-2 border-ink pb-2 font-serif text-[1.25rem] font-semibold">Password</h2>
            {officer.email && <p className="mb-4 text-[0.9375rem] text-slate">You log in as {officer.email}.</p>}
            <PasswordForm setup={false} />
          </section>
        )}
      </div>
    </>
  );
}
