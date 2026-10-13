"use client";
import { useActionState } from "react";
import { subscribe, type SubscribeState } from "@/app/actions/newsletter";

const initial: SubscribeState = { status: "idle", message: "" };

export function NewsletterForm({ tone = "band" }: { tone?: "band" | "page" }) {
  const [state, action, pending] = useActionState(subscribe, initial);
  const onBand = tone === "band";

  if (state.status === "ok") {
    return (
      <p role="status" className={onBand ? "text-on-band" : "text-ink"}>
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="w-full max-w-md">
      <label htmlFor={`nl-email-${tone}`} className={`label ${onBand ? "text-on-band" : ""}`}>
        Email address
      </label>
      <div className="flex gap-2">
        <input
          id={`nl-email-${tone}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="field min-w-0 flex-1"
        />
        <div aria-hidden="true" className="hidden">
          <input name="company" tabIndex={-1} autoComplete="off" />
        </div>
        <button type="submit" disabled={pending} className={`btn ${onBand ? "btn-on-band" : "btn-primary"}`}>
          {pending ? "Signing up" : "Sign up"}
        </button>
      </div>
      {state.status === "error" && (
        <p role="alert" className={`mt-2 text-sm ${onBand ? "text-[#f3b9b2]" : "text-danger"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
