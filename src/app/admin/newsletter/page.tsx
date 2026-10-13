import { removeSubscriber } from "@/app/admin/actions/newsletter";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { SendCustomForm, SendPostForm } from "@/components/admin/newsletter-forms";
import { Notice, PageTitle } from "@/components/admin/notice";
import { requireAdmin } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/server";

export default async function AdminNewsletterPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ count: active }, { data: recent }, { data: posts }, { data: sends }] = await Promise.all([
    admin.from("subscribers").select("id", { count: "exact", head: true }).is("unsubscribed_at", null),
    admin.from("subscribers").select("id, email, created_at").is("unsubscribed_at", null).order("created_at", { ascending: false }).limit(50),
    admin.from("posts").select("id, title, emailed_at").eq("status", "published").order("published_at", { ascending: false }).limit(30),
    admin.from("newsletter_sends").select("id, subject, recipient_count, sent_at").order("sent_at", { ascending: false }).limit(10),
  ]);
  const subscriberCount = active ?? 0;
  const cantSend = !isEmailConfigured || subscriberCount === 0;

  return (
    <>
      <PageTitle
        action={
          <a href="/admin/newsletter/export" className="btn btn-quiet">
            Download subscriber list
          </a>
        }
      >
        Newsletter
      </PageTitle>

      <p className="mb-6 text-[1.0625rem]">
        <span className="headline text-[2rem]">{subscriberCount}</span>{" "}
        <span className="text-slate">subscriber{subscriberCount === 1 ? "" : "s"}</span>
      </p>

      {!isEmailConfigured && (
        <div className="mb-8 max-w-3xl">
          <Notice tone="info">
            Sending is off until email is set up. Sign-ups still collect. Follow the email step in the setup guide (it needs your domain), then add
            RESEND_API_KEY and NEWSLETTER_FROM_EMAIL in Vercel.
          </Notice>
        </div>
      )}

      <div className="grid max-w-5xl gap-8 lg:grid-cols-2">
        <section className="border border-rule bg-surface p-5 sm:p-6">
          <h2 className="mb-4 font-serif text-[1.25rem] font-semibold">Email a post</h2>
          <SendPostForm
            subscriberCount={subscriberCount}
            disabled={cantSend}
            posts={(posts ?? []).map((p) => ({ id: p.id, title: p.title, emailed: Boolean(p.emailed_at) }))}
          />
        </section>
        <section className="border border-rule bg-surface p-5 sm:p-6">
          <h2 className="mb-4 font-serif text-[1.25rem] font-semibold">Write a message</h2>
          <SendCustomForm subscriberCount={subscriberCount} disabled={cantSend} />
        </section>
      </div>

      <div className="mt-12 grid max-w-5xl gap-10 lg:grid-cols-2">
        <section>
          <h2 className="border-b-2 border-ink pb-2 font-serif text-[1.25rem] font-semibold">Sent</h2>
          {sends?.length ? (
            <ul>
              {sends.map((s) => (
                <li key={s.id} className="border-b border-rule py-3">
                  <p className="font-medium">{s.subject}</p>
                  <p className="text-[0.8125rem] text-slate">
                    {formatDate(s.sent_at)}, {s.recipient_count} recipients
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-slate">Nothing sent yet.</p>
          )}
        </section>
        <section>
          <h2 className="border-b-2 border-ink pb-2 font-serif text-[1.25rem] font-semibold">Newest subscribers</h2>
          {recent?.length ? (
            <ul>
              {recent.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 border-b border-rule py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[0.9375rem]">{s.email}</p>
                    <p className="text-[0.75rem] text-muted">Joined {formatDate(s.created_at)}</p>
                  </div>
                  <form action={removeSubscriber}>
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmButton className="text-[0.8125rem] text-danger hover:underline" message={`Remove ${s.email} from the list?`}>
                      Remove
                    </ConfirmButton>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-slate">No one yet. The sign-up box is at the bottom of every page.</p>
          )}
        </section>
      </div>
    </>
  );
}
