import { formatEventDay, formatTimeRange } from "@/lib/format";
import type { ClubEvent } from "@/lib/types";

/** A calendar-leaf date block next to the event details. */
export function EventRow({ event, compact = false, past = false }: { event: ClubEvent; compact?: boolean; past?: boolean }) {
  const d = formatEventDay(event.starts_at);
  return (
    <article className={`flex gap-4 border-t border-rule first-of-type:border-t-0 ${compact ? "py-4" : "py-6"} ${past ? "opacity-75" : ""}`}>
      <div
        className={`flex w-14 shrink-0 flex-col items-center border-t-2 pt-1.5 text-center ${past ? "border-rule" : "border-gold"}`}
        aria-hidden="true"
      >
        <span className="text-[0.75rem] font-semibold text-slate">{d.month}</span>
        <span className="headline text-[1.75rem] leading-none">{d.day}</span>
        <span className="mt-0.5 text-[0.75rem] text-muted">{d.weekday}</span>
      </div>
      <div className="min-w-0">
        <h3 className={`font-serif font-semibold leading-snug ${compact ? "text-[1.125rem]" : "text-[1.35rem]"}`}>
          {event.title}
        </h3>
        <p className="mt-1 text-[0.875rem] text-slate">
          <span className="sr-only">{d.full}, </span>
          {formatTimeRange(event.starts_at, event.ends_at)}
          {event.location ? `, ${event.location}` : ""}
        </p>
        {!compact && event.description && <p className="mt-2 max-w-[60ch] text-ink">{event.description}</p>}
        {!compact && event.link && (
          <p className="mt-2 text-[0.9375rem]">
            <a className="link" href={event.link} target="_blank" rel="noopener noreferrer">
              Event details
            </a>
          </p>
        )}
      </div>
    </article>
  );
}
