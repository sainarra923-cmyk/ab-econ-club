"use client";
import { startTransition, useActionState } from "react";
import { sendCustomNewsletter, sendPostNewsletter, type SendState } from "@/app/admin/actions/newsletter";
import { Notice } from "./notice";

function confirmAndSend(message: string, action: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!confirm(message)) return;
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}

export function SendPostForm({
  posts,
  subscriberCount,
  disabled,
}: {
  posts: { id: string; title: string; emailed: boolean }[];
  subscriberCount: number;
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState<SendState, FormData>(sendPostNewsletter, {});
  return (
    <form onSubmit={confirmAndSend(`Email this post to ${subscriberCount} subscribers?`, action)} className="space-y-4">
      {state.message && <Notice>{state.message}</Notice>}
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <div>
        <label htmlFor="post_id" className="label">Post</label>
        <select id="post_id" name="post_id" required className="field" defaultValue={posts.find((p) => !p.emailed)?.id ?? ""}>
          <option value="" disabled>
            Pick a published post
          </option>
          {posts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
              {p.emailed ? " (already sent)" : ""}
            </option>
          ))}
        </select>
        <p className="hint">Sends the title, summary, cover image, and a button to read it on the site.</p>
      </div>
      <button type="submit" disabled={pending || disabled || !posts.length} className="btn btn-primary">
        {pending ? "Sending" : "Send to subscribers"}
      </button>
    </form>
  );
}

export function SendCustomForm({ subscriberCount, disabled }: { subscriberCount: number; disabled: boolean }) {
  const [state, action, pending] = useActionState<SendState, FormData>(sendCustomNewsletter, {});
  return (
    <form onSubmit={confirmAndSend(`Send this message to ${subscriberCount} subscribers?`, action)} className="space-y-4">
      {state.message && <Notice>{state.message}</Notice>}
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <div>
        <label htmlFor="subject" className="label">Subject</label>
        <input id="subject" name="subject" required className="field" placeholder="This month at AB Econ" />
      </div>
      <div>
        <label htmlFor="nl-body" className="label">Message</label>
        <textarea id="nl-body" name="body" required rows={8} className="field font-serif" placeholder={"Write your update here.\n\nYou can use **bold**, lists, and [links](https://example.com)."} />
      </div>
      <button type="submit" disabled={pending || disabled} className="btn btn-primary">
        {pending ? "Sending" : "Send message"}
      </button>
    </form>
  );
}
