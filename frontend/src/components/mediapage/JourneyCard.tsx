import Icon from "../Icon.tsx";
import type {Journey} from "./progress/journey.ts";
import type {Title} from "./titles.ts";

const STATUSES = ["Completed", "Paused", "Dropped", "For later"]
// Past this many units, one segment each gets too thin to read
const MAX_SEGMENTS = 60

export default function JourneyCard({ title, journey, activeStatus, onStatusChange, onRate }: {
    title: Title
    journey: Journey
    activeStatus: string
    onStatusChange?: (status: string) => void
    onRate?: () => void
}) {
    const segmented = journey.segments !== undefined && journey.segments <= MAX_SEGMENTS
    const options = [activeStatus, ...STATUSES]

    return (
        <section id="journey" className="flex flex-col gap-5.5 rounded-xl border border-line bg-surface p-6">
            <h2 className="m-0 font-serif text-[27px] font-normal text-ink">Your journey</h2>

            <label className="relative flex items-center gap-2.5 rounded-md bg-accent-soft p-3.25 text-base font-semibold text-accent">
                <span aria-hidden="true" className="block size-1.5 rounded-full bg-accent" />
                <span className="sr-only">Status</span>
                <select
                    defaultValue={options.includes(title.status) ? title.status : activeStatus}
                    onChange={(e) => onStatusChange?.(e.target.value)}
                    className="flex-1 cursor-pointer appearance-none bg-transparent [color-scheme:dark] focus:outline-none"
                >
                    {options.map((o) => <option key={o}>{o}</option>)}
                </select>
                <Icon src="/space-icons/chevron-right.svg" box="size-4" className="pointer-events-none rotate-90" />
            </label>

            <div className="flex flex-col gap-3.5">
                <div className="flex items-end justify-between gap-3">
                    <p className="m-0 font-medium text-ink">
                        <span className="text-[30px]">{journey.value} </span>
                        <span className="text-lg text-ink-muted">{journey.of}</span>
                    </p>
                    <p className="m-0 text-[15px] text-accent">{journey.percent}%</p>
                </div>

                {segmented ? (
                    <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={journey.segments}
                        aria-valuenow={journey.filled}
                        aria-label={`${title.title} progress`}
                        className="flex gap-0.75"
                    >
                        {Array.from({ length: journey.segments! }, (_, i) => (
                            <span key={i} className={`h-5 min-w-px flex-1 rounded-xs ${i < journey.filled! ? "bg-accent" : "bg-surface-raised"}`} />
                        ))}
                    </div>
                ) : (
                    <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={journey.percent}
                        aria-label={`${title.title} progress`}
                        className="h-5 overflow-hidden rounded-xs bg-surface-raised"
                    >
                        <div className="h-full bg-accent transition-[width]" style={{ width: `${journey.percent}%` }} />
                    </div>
                )}

                {(journey.left || journey.right) && (
                    <div className="flex justify-between text-[13px]">
                        <p className="m-0 text-ink-soft">{journey.left}</p>
                        <p className="m-0 text-ink-muted">{journey.right}</p>
                    </div>
                )}
            </div>

            {journey.next && (
                <>
                    <hr className="m-0 h-px border-0 bg-line" />
                    <div className="flex flex-col items-start gap-2.5">
                        <p className="m-0 text-[13px] font-semibold text-ink-muted uppercase">Next on your journey</p>
                        <p className="m-0 text-lg font-semibold text-ink">{journey.next}</p>
                        {journey.action && (
                            journey.action.href ? (
                                <a href={journey.action.href} className="mt-1 flex items-center gap-2 rounded-md border border-accent bg-accent px-4.5 py-3.25 text-base font-semibold text-bg transition-opacity hover:opacity-90">
                                    {journey.action.label}
                                </a>
                            ) : (
                                <button type="button" onClick={journey.action.onClick} className="mt-1 flex cursor-pointer items-center gap-2 rounded-md border border-accent bg-accent px-4.5 py-3.25 text-base font-semibold text-bg transition-opacity hover:opacity-90">
                                    <img src="/featured/check.svg" alt="" aria-hidden="true" width={16} height={16} />
                                    {journey.action.label}
                                </button>
                            )
                        )}
                    </div>
                </>
            )}

            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1.25">
                    <p className="m-0 text-[15px] text-ink-soft">Your rating</p>
                    <button type="button" onClick={onRate} className="cursor-pointer self-start text-[13px] text-ink-muted hover:text-accent">
                        {title.yourRating ? "Edit rating" : "Rate it"}
                    </button>
                </div>
                <p className="m-0 flex items-center gap-2 text-ink">
                    <Icon src="/icons/star.svg" box="size-4.5" className={title.yourRating ? "text-accent" : "text-ink-muted"} />
                    <span className="text-[24px]">{title.yourRating?.toFixed(1) ?? "—"}</span>
                    <span className="text-[15px] text-ink-muted">/ 10</span>
                </p>
            </div>
        </section>
    )
}
