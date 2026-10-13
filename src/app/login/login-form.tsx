"use client";
import { useActionState, useState } from "react";
import { sendReset, signIn, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [loginState, loginAction, loggingIn] = useActionState<LoginState, FormData>(signIn, {});
  const [resetState, resetAction, resetting] = useActionState<LoginState, FormData>(sendReset, {});

  if (mode === "reset") {
    return (
      <form action={resetAction} className="space-y-4">
        <div>
          <label htmlFor="reset-email" className="label">Email</label>
          <input id="reset-email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
        {resetState.error && <p role="alert" className="text-sm text-danger">{resetState.error}</p>}
        {resetState.message && <p role="status" className="text-sm text-ok">{resetState.message}</p>}
        <button type="submit" disabled={resetting} className="btn btn-primary w-full">
          {resetting ? "Sending" : "Send reset link"}
        </button>
        <button type="button" onClick={() => setMode("login")} className="w-full text-sm text-accent-ink hover:underline">
          Back to log in
        </button>
      </form>
    );
  }

  return (
    <form action={loginAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      {loginState.error && <p role="alert" className="text-sm text-danger">{loginState.error}</p>}
      <button type="submit" disabled={loggingIn} className="btn btn-primary w-full">
        {loggingIn ? "Logging in" : "Log in"}
      </button>
      <button type="button" onClick={() => setMode("reset")} className="w-full text-sm text-accent-ink hover:underline">
        Forgot your password?
      </button>
    </form>
  );
}
