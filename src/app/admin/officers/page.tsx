import { removeOfficer, updateOfficer } from "@/app/admin/actions/officers";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Notice, PageTitle } from "@/components/admin/notice";
import { InviteForm, ResetLinkForm } from "@/components/admin/officer-forms";
import { requireAdmin } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function AdminOfficersPage() {
  const me = await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("*").order("sort_order").order("name");
  const profiles = (data ?? []) as Profile[];

  const { data: users } = await admin.auth.admin.listUsers({ perPage: 200 });
  const emailById = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  return (
    <>
      <PageTitle>Officers</PageTitle>

      <section className="mb-12 max-w-4xl border border-rule bg-surface p-5 sm:p-6">
        <h2 className="font-serif text-[1.25rem] font-semibold">Invite an officer</h2>
        <p className="mb-5 mt-1 text-[0.9375rem] text-slate">
          {isEmailConfigured
            ? "They'll get an email with a link to set their password. You'll also get the link here to send yourself."
            : "You'll get a link to send them by text or email. It lets them set a password and start posting."}
        </p>
        <InviteForm />
      </section>

      <section className="max-w-4xl">
        <h2 className="border-b-2 border-ink pb-2 font-serif text-[1.25rem] font-semibold">Everyone on the Officers page</h2>
        <p className="mt-3 text-[0.9375rem] text-slate">
          Lower order numbers show first. Unchecking Shown hides someone from the site and blocks their login without deleting them.
        </p>
        <ul className="mt-2">
          {profiles.map((p) => {
            const isMe = p.id === me.profile.id;
            const email = p.user_id ? emailById.get(p.user_id) : null;
            return (
              <li key={p.id} className="border-b border-rule py-5">
                <div className="mb-3">
                  <p className="font-semibold">
                    {p.name}
                    {p.is_admin && <span className="ml-2 text-[0.8125rem] font-medium text-gold-ink">Admin</span>}
                  </p>
                  <p className="text-[0.8125rem] text-slate">{p.user_id ? email || "Has a login" : "Placeholder profile with no login"}</p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <form action={updateOfficer} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="id" value={p.id} />
                    <div>
                      <label className="label !text-[0.8125rem]" htmlFor={`t-${p.id}`}>Role</label>
                      <input id={`t-${p.id}`} name="title" defaultValue={p.title ?? ""} className="field !w-44 !py-1.5" />
                    </div>
                    <div>
                      <label className="label !text-[0.8125rem]" htmlFor={`o-${p.id}`}>Order</label>
                      <input id={`o-${p.id}`} name="sort_order" type="number" defaultValue={p.sort_order} className="field !w-20 !py-1.5" />
                    </div>
                    <label className="flex items-center gap-2 pb-2 text-[0.875rem]">
                      <input type="checkbox" name="active" defaultChecked={p.active} disabled={isMe} />
                      Shown
                      {isMe && <input type="hidden" name="active" value="on" />}
                    </label>
                    <button className="btn btn-quiet !py-1.5 text-[0.875rem]">Save</button>
                  </form>
                  {!isMe && (
                    <form action={removeOfficer}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton
                        className="btn btn-danger !py-1.5 text-[0.875rem]"
                        message={`Remove ${p.name}? Their login is deleted. Their posts stay up without a name on them.`}
                      >
                        Remove
                      </ConfirmButton>
                    </form>
                  )}
                </div>
                {p.user_id && !isMe && (
                  <div className="mt-3">
                    <ResetLinkForm userId={p.user_id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {profiles.length === 0 && <div className="mt-4"><Notice tone="info">No officers yet.</Notice></div>}
      </section>
    </>
  );
}
