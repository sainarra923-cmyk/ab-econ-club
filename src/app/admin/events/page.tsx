import Link from "next/link";
import { EventForm } from "@/components/admin/event-form";
import { Notice, PageTitle } from "@/components/admin/notice";
import { formatEventDay, formatTimeRange } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ClubEvent } from "@/lib/types";

function splitByNow(events: ClubEvent[]) {
  const now = Date.now();
  const isOver = (e: ClubEvent) => new Date(e.ends_at ?? e.starts_at).getTime() < now;
  return { upcoming: events.filter((e) => !isOver(e)).reverse(), past: events.filter(isOver) };
}

const DONE: Record<string, string> = { added: "Event added.", updated: "Event updated.", deleted: "Event deleted." };

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const { done } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").order("starts_at", { ascending: false });
  const events = (data ?? []) as ClubEvent[];
  const { upcoming, past } = splitByNow(events);

  return (
    <>
      <PageTitle>Events</PageTitle>
      {done && DONE[done] && <div className="mb-6"><Notice>{DONE[done]}</Notice></div>}

      <section className="mb-12 border border-rule bg-surface p-5 sm:p-6">
        <h2 className="mb-5 font-serif text-[1.25rem] font-semibold">Add an event</h2>
        <EventForm submitLabel="Add event" />
      </section>

      <EventList title="Upcoming" events={upcoming} empty="Nothing scheduled." />
      <EventList title="Past" events={past} empty="No past events." />
    </>
  );
}

function EventList({ title, events, empty }: { title: string; events: ClubEvent[]; empty: string }) {
  return (
    <section className="mb-10">
      <h2 className="border-b-2 border-ink pb-2 font-serif text-[1.25rem] font-semibold">{title}</h2>
      {events.length === 0 ? (
        <p className="py-5 text-slate">{empty}</p>
      ) : (
        <ul>
          {events.map((e) => {
            const d = formatEventDay(e.starts_at);
            return (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-rule py-4">
                <div>
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-[0.875rem] text-slate">
                    {d.full}, {formatTimeRange(e.starts_at, e.ends_at)}
                    {e.location ? `, ${e.location}` : ""}
                  </p>
                </div>
                <Link href={`/admin/events/${e.id}`} className="btn btn-quiet">Edit</Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
