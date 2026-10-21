import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import {episodePath} from "../mediapage/titles.ts";

// An episode airing soon for something you're following (UpcomingEpisode.java)
export type Upcoming = {
    mediaId: number
    mediaTitle: string
    kind: string
    number: number
    season: number | null
    seasonNumber: number | null
    title: string | null
    airDate: string
}

// "T00:00" makes the date local midnight; a bare "2026-10-21" is UTC and can land on the 20th
function toLocalDate(date: string) {
    return new Date(`${date}T00:00`)
}

function relativeDay(date: Date) {
    const days = Math.round((date.getTime() - new Date(new Date().toDateString()).getTime()) / 86_400_000)
    if (days === 0) return "Today"
    if (days === 1) return "Tomorrow"
    return date.toLocaleDateString('en-US', { weekday: 'long' })
}

export default function CalendarCard({ upcoming }: { upcoming: Upcoming[] | null }) {
    const PLANS = (upcoming ?? []).map((u) => ({
        date: u.airDate,
        title: u.mediaTitle,
        to: episodePath(u.mediaId, u.number),
        detail: `${u.season ? `S${u.season} · ` : ""}Episode ${u.seasonNumber ?? u.number}${u.title ? ` · ${u.title}` : ""}`,
    }))
    return (
        <section className="flex h-full flex-col gap-6 rounded-xl bg-surface p-6">
            <div className="flex items-center justify-between gap-4">
                <h2 className="m-0 font-serif text-[27px] font-normal text-ink">
                    On your calendar
                </h2>
                <Icon src="/space-icons/calendar-days.svg" box="size-4.5" className="text-ink-muted" />
            </div>

            {upcoming !== null && PLANS.length === 0 && (
                <p className="m-0 text-[15px] text-ink-muted">
                    Nothing airing soon for the shows you’re following. New episodes appear here once their dates are known.
                </p>
            )}

            <ul className="m-0 flex list-none flex-col gap-6 p-0">
                {PLANS.map((plan) => {
                    const day = toLocalDate(plan.date)
                    return (
                        <li key={`${plan.date}-${plan.title}`} className="flex items-center gap-3.5">
                            <time
                                dateTime={plan.date}
                                className="flex h-13.25 w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded bg-surface-raised"
                            >
                                <span className="text-xl leading-none text-ink">{day.getDate()}</span>
                                <span className="text-[10px] text-ink-muted">
                                    {day.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                                </span>
                            </time>
                            <div className="flex min-w-0 flex-col gap-1.75">
                                <Link to={plan.to} className="text-base font-semibold text-ink hover:text-accent">{plan.title}</Link>
                                <p className="m-0 text-[13px] text-ink-muted">{relativeDay(day)} · {plan.detail}</p>
                            </div>
                        </li>
                    )
                })}
            </ul>

            <Link to="/library?status=in-progress" className="mt-auto flex items-center gap-1.75 self-start text-[14px] text-accent transition-opacity hover:opacity-80">
                See what you’re following
                <Icon src="/featured/arrow-up-right.svg" box="size-[13px]" />
            </Link>
        </section>
    )
}
