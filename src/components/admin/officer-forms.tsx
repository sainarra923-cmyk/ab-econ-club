"use client";
import { startTransition, useActionState, useState } from "react";
import { inviteOfficer, makeResetLink, type InviteState } from "@/app/admin/actions/officers";
import { Notice } from "./notice";

function LinkResult({ state }: { state: InviteState }) {
  const [copied, setCopied] = useState(false);
  if (state.error) return <Notice tone="error">{state.error}</Notice>;
  if (!state.message) return null;
  return (
    <Notice>
      <p>{state.message}</p>
      {state.link && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input readOnly value={state.link} className="field min-w-0 flex-1 !py-1.5 text-[0.8125rem] text-ink" onFocus={(e) => e.currentTarget.select()} />
          <button
            type="button"
            className="btn btn-quiet !py-1.5"
            onClick={async () => {
              await navigator.clipboard.writeText(state.link!);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      )}
    </Notice>
  );
}

export function InviteForm() {
  const [state, action, pending] = useActionState<InviteState, FormData>(inviteOfficer, {});
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        startTransition(() => action(data));
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="inv-name" className="label">Name</label>
          <input id="inv-name" name="name" required className="field" />
        </div>
        <div>
          <label htmlFor="inv-title" className="label">Role</label>
          <input id="inv-title" name="title" placeholder="Treasurer" className="field" />
        </div>
        <div>
          <label htmlFor="inv-email" className="label">Email</label>
          <input id="inv-email" name="email" type="email" required className="field" />
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Creating invite" : "Invite officer"}
      </button>
      <LinkResult state={state} />
    </form>
  );
}

export function ResetLinkForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(makeResetLink, {});
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="user_id" value={userId} />
      {!state.message && !state.error && (
        <button type="submit" disabled={pending} className="btn btn-quiet !py-1.5 text-[0.875rem]">
          {pending ? "Making link" : "Password reset link"}
        </button>
      )}
      <LinkResult state={state} />
    </form>
  );
}
