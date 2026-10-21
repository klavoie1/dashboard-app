import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";

type Plan = {
    // ISO date, e.g. "2026-10-21"
    date: string
    title: string
    detail: string
}

// Placeholder plans until scheduling is stored in the backend
const PLANS: Plan[] = [
    { date: '2026-10-21', title: 'Dune: Part Two', detail: 'Finish watching · Tomorrow evening' },
    { date: '2026-10-23', title: 'Frieren · Episode 7', detail: 'Watch night · Friday, 8:00 pm' },
    { date: '2026-10-25', title: 'Project Hail Mary', detail: 'Listening hour · Sunday, 10:00 am' },
]

// "T00:00" makes the date local midnight; a bare "2026-10-21" is UTC and can land on the 20th
function toLocalDate(date: string) {
    return new Date(`${date}T00:00`)
}

export default function CalendarCard() {
    return (
        <section className="flex h-full flex-col gap-6 rounded-xl bg-surface p-6">
            <div className="flex items-center justify-between gap-4">
                <h2 className="m-0 font-serif text-[27px] font-normal text-ink">
                    On your calendar
                </h2>
                <Icon src="/space-icons/calendar-days.svg" box="size-4.5" className="text-ink-muted" />
            </div>

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
                                <span className="text-[8px] text-ink-muted">
                                    {day.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                                </span>
                            </time>
                            <div className="flex min-w-0 flex-col gap-1.75">
                                <p className="m-0 text-[13px] font-semibold text-ink">{plan.title}</p>
                                <p className="m-0 text-[10px] text-ink-muted">{plan.detail}</p>
                            </div>
                        </li>
                    )
                })}
            </ul>

            <Link to="/journal" className="mt-auto flex items-center gap-1.75 self-start text-[11px] text-accent transition-opacity hover:opacity-80">
                View your schedule
                <Icon src="/featured/arrow-up-right.svg" box="size-[13px]" />
            </Link>
        </section>
    )
}
