"use client";
import { startTransition, useActionState } from "react";
import { saveEvent, type EventFormState } from "@/app/admin/actions/events";
import { Notice } from "./notice";

type Initial = {
  id?: string;
  title?: string;
  date?: string;
  start?: string;
  end?: string;
  location?: string | null;
  description?: string | null;
  link?: string | null;
};

export function EventForm({ initial = {}, submitLabel }: { initial?: Initial; submitLabel: string }) {
  const [state, action, pending] = useActionState<EventFormState, FormData>(saveEvent, {});
  return (
    <form
      // onSubmit (not action=) so the fields keep what was typed if there's an error.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="grid gap-5 sm:grid-cols-2"
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {state.error && <div className="sm:col-span-2"><Notice tone="error">{state.error}</Notice></div>}
      <div className="sm:col-span-2">
        <label htmlFor="ev-title" className="label">Event name</label>
        <input id="ev-title" name="title" required defaultValue={initial.title} placeholder="Weekly meeting: trade policy" className="field" />
      </div>
      <div>
        <label htmlFor="ev-date" className="label">Date</label>
        <input id="ev-date" name="date" type="date" required defaultValue={initial.date} className="field" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ev-start" className="label">Starts</label>
          <input id="ev-start" name="start" type="time" required defaultValue={initial.start ?? "14:30"} className="field" />
        </div>
        <div>
          <label htmlFor="ev-end" className="label">Ends</label>
          <input id="ev-end" name="end" type="time" defaultValue={initial.end} className="field" />
        </div>
      </div>
      <div>
        <label htmlFor="ev-location" className="label">Where</label>
        <input id="ev-location" name="location" defaultValue={initial.location ?? ""} placeholder="Room 214" className="field" />
      </div>
      <div>
        <label htmlFor="ev-link" className="label">Link</label>
        <input id="ev-link" name="link" defaultValue={initial.link ?? ""} placeholder="Optional, e.g. a sign-up form" className="field" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="ev-desc" className="label">Details</label>
        <textarea id="ev-desc" name="description" rows={3} defaultValue={initial.description ?? ""} placeholder="What's happening and what to bring." className="field" />
        <p className="hint">Times are Eastern.</p>
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving" : submitLabel}
        </button>
      </div>
    </form>
  );
}
