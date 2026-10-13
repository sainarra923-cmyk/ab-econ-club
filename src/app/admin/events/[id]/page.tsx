import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteEvent } from "@/app/admin/actions/events";
import { EventForm } from "@/components/admin/event-form";
import { PageTitle } from "@/components/admin/notice";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { isoToEastern } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ClubEvent } from "@/lib/types";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const e = data as ClubEvent;
  const start = isoToEastern(e.starts_at);
  const end = isoToEastern(e.ends_at);

  return (
    <>
      <p className="mb-2 text-[0.875rem]">
        <Link href="/admin/events" className="text-accent-ink hover:underline">All events</Link>
      </p>
      <PageTitle>Edit event</PageTitle>
      <div className="max-w-3xl border border-rule bg-surface p-5 sm:p-6">
        <EventForm
          submitLabel="Save changes"
          initial={{
            id: e.id,
            title: e.title,
            date: start.date,
            start: start.time,
            end: end.time,
            location: e.location,
            description: e.description,
            link: e.link,
          }}
        />
      </div>
      <form action={deleteEvent} className="mt-10 border-t border-rule pt-6">
        <input type="hidden" name="id" value={e.id} />
        <ConfirmButton message="Delete this event?">Delete event</ConfirmButton>
      </form>
    </>
  );
}
