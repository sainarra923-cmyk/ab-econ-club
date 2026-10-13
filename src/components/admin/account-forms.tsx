"use client";
import { startTransition, useActionState } from "react";
import { changePassword, saveProfile, type AccountState } from "@/app/admin/actions/account";
import type { Profile } from "@/lib/types";
import { ImageField } from "./image-field";
import { Notice } from "./notice";

function submitWith(action: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}

export function ProfileForm({ profile, userId }: { profile: Profile; userId: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(saveProfile, {});
  return (
    <form onSubmit={submitWith(action)} className="space-y-5">
      {state.message && <Notice>{state.message}</Notice>}
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <ImageField name="photo_url" label="Photo" userId={userId} initialUrl={profile.photo_url} shape="round" hint="A square photo works best." />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="label">Name</label>
          <input id="name" name="name" required defaultValue={profile.name} className="field" />
        </div>
        <div>
          <label htmlFor="title" className="label">Role</label>
          <input id="title" name="title" defaultValue={profile.title ?? ""} placeholder="Treasurer" className="field" />
        </div>
        <div>
          <label htmlFor="grade" className="label">Grade</label>
          <input id="grade" name="grade" defaultValue={profile.grade ?? ""} placeholder="11th grade" className="field" />
        </div>
      </div>
      <div>
        <label htmlFor="bio" className="label">Short bio</label>
        <textarea id="bio" name="bio" rows={4} maxLength={600} defaultValue={profile.bio ?? ""} placeholder="What you're interested in, what you write about." className="field" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving" : "Save profile"}
      </button>
    </form>
  );
}

export function PasswordForm({ setup }: { setup: boolean }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(changePassword, {});
  return (
    <form onSubmit={submitWith(action)} className="space-y-5">
      {state.message && <Notice>{state.message}</Notice>}
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className="label">{setup ? "Choose a password" : "New password"}</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
          <p className="hint">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="confirm" className="label">Type it again</label>
          <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field" />
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving" : setup ? "Set password" : "Change password"}
      </button>
    </form>
  );
}
