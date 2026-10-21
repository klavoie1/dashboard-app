import {useState} from "react";

function timeOfDay(hour: number) {
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
}

export default function GreetingHeader({
    userName = "User",
    onLogUpdate,
}: {
    userName?: string
    onLogUpdate?: () => void
}) {
    const [date] = useState(() => new Date());
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;            // Monday = 1 ... Sunday = 7
    d.setUTCDate(d.getUTCDate() + 4 - day);    // jump to the Thursday of this week
    const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
    const dateFormat = date.toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric",
    });

    return (
        <section className="flex flex-wrap items-center justify-between gap-6 pt-8 pb-7">
            <div className="flex flex-col gap-2">
                <p className="m-0 text-[13px] uppercase text-ink-muted">{dateFormat} • Week {week}</p>
                <h1 className="m-0 font-serif text-[38px] font-normal leading-normal text-ink">
                    Good {timeOfDay(date.getHours())}, {userName}.
                </h1>
                <p className="m-0 text-base text-ink-soft">
                    A few pages, another episode, a whole new world. Where to next?
                </p>
            </div>

            <button
                type="button"
                onClick={onLogUpdate}
                className="flex shrink-0 cursor-pointer items-center gap-2 rounded-md border border-line bg-surface-raised px-3.5 py-2.75 text-[15px] font-semibold text-ink transition-colors hover:border-accent"
            >
                <img src="/greeting-icons/plus.svg" alt="" aria-hidden="true" width={15} height={15} />
                Log an update
            </button>
        </section>
    )
}
