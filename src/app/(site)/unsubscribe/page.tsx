import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

const UUID_RE = /^[0-9a-f-]{36}$/i;

async function unsubscribe(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  if (UUID_RE.test(token) && isSupabaseConfigured) {
    await createAdminClient()
      .from("subscribers")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("token", token);
  }
  redirect("/unsubscribe?done=1");
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string }>;
}) {
  const { token, done } = await searchParams;

  return (
    <div className="max-w-xl pt-12">
      <h1 className="headline text-[2.4rem]">{done ? "You're unsubscribed" : "Unsubscribe"}</h1>
      {done ? (
        <p className="mt-4 text-slate">You won't get any more newsletter emails. You can sign up again at the bottom of any page.</p>
      ) : token ? (
        <form action={unsubscribe} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <p className="text-slate">Stop getting new posts from the AB Economics Club by email?</p>
          <button type="submit" className="btn btn-primary mt-5">
            Unsubscribe
          </button>
        </form>
      ) : (
        <p className="mt-4 text-slate">Use the unsubscribe link at the bottom of any newsletter email.</p>
      )}
    </div>
  );
}
