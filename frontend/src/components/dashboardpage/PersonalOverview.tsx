import type {MediaSummary} from "../library/media.ts";

const GOAL_YEAR = new Date().getFullYear()
const GOAL = 30

export default function PersonalOverview({ media }: { media: MediaSummary[] | null }) {
    const count = (status: string) => media?.filter((m) => m.status === status).length ?? 0
    const METRICS = [
        { value: count('in-progress'), label: 'In Progress', description: 'Across all your worlds' },
        { value: count('finished'), label: 'Completed', description: 'Stories that stay with you' },
        { value: count('want'), label: 'For Later', description: 'Your next great find' }
    ]
    // Titles finished this year count toward the goal
    const GOAL_PROGRESS = media?.filter((m) => m.finishedOn?.startsWith(String(GOAL_YEAR))).length ?? 0
    const percent = GOAL > 0 ? Math.min(100, (GOAL_PROGRESS / GOAL) * 100) : 0
    const remaining = GOAL - GOAL_PROGRESS
    const message = remaining > 0
        ? `${remaining} more ${remaining === 1 ? 'story' : 'stories'}. Plenty of possibility.`
        : 'Goal reached. Everything from here is a bonus.'

    return (
        <section className="border-b border-line py-6">

            {/* Using the map to display the overview in a 'list' order */}
            <ul className="m-0 grid list-none grid-cols-1 gap-x-8 gap-y-6 p-0 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_1.25fr]">
                {METRICS.map(({ value, label, description }) => (
                    <li key={label} className="flex items-center gap-4">
                        <p className="m-0 font-serif text-[38px] text-ink">
                            {value}
                        </p>

                        <div className="flex flex-col gap-px">
                            <p className="m-0 text-[15px] text-ink">
                                {label}
                            </p>
                            <p className="m-0 text-[13px] text-ink-muted">
                                {description}
                            </p>
                        </div>
                    </li>
                ))}

                <li className="flex flex-col justify-center gap-2.5 sm:col-span-3 lg:col-span-1">
                    <div className="flex justify-between">
                        <p className="m-0 text-[15px] text-ink">
                            Your {GOAL_YEAR} Goal
                        </p>
                        <p className="m-0 text-[14px] text-accent">
                            {GOAL_PROGRESS} / {GOAL} Stories
                        </p>
                    </div>
                    <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={GOAL}
                        aria-valuenow={GOAL_PROGRESS}
                        aria-label={`${GOAL_YEAR} story goal`}
                        className="h-1 w-full overflow-hidden rounded bg-line"
                    >
                        <div className="h-full rounded bg-accent" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="m-0 text-[13px] text-ink-muted">
                        {message}
                    </p>
                </li>
            </ul>
        </section>
    )
}
