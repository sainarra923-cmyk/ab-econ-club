import type { Metadata } from "next";
import { EventRow } from "@/components/event-bits";
import { site } from "@/content/site";
import { getEvents } from "@/lib/data";

export const metadata: Metadata = { title: "Events", description: "Meetings, speakers, and competitions." };

export default async function EventsPage() {
  const { upcoming, past } = await getEvents();
  return (
    <div className="pt-10">
      <h1 className="headline text-[2.5rem] sm:text-[3.2rem]">Events</h1>
      <p className="mt-2 max-w-[56ch] text-slate">{site.meeting} Everyone is welcome; no sign-up needed.</p>

      <section aria-labelledby="upcoming-heading" className="mt-10 max-w-3xl">
        <h2 id="upcoming-heading" className="border-b-2 border-ink pb-2 font-serif text-[1.25rem] font-semibold">
          Upcoming
        </h2>
        {upcoming.length ? (
          upcoming.map((e) => <EventRow key={e.id} event={e} />)
        ) : (
          <p className="py-6 text-slate">Nothing on the calendar yet. Check back soon.</p>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-heading" className="mt-14 max-w-3xl">
          <h2 id="past-heading" className="border-b border-rule pb-2 font-serif text-[1.125rem] font-semibold text-slate">
            Past events
          </h2>
          {past.slice(0, 12).map((e) => (
            <EventRow key={e.id} event={e} compact past />
          ))}
        </section>
      )}
    </div>
  );
}
