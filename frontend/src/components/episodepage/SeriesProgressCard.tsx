import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import {episodeAt, episodePath, type Title} from "../mediapage/titles.ts";
import {formatMinutes} from "../mediapage/progress/styles.ts";
import {shortName} from "./format.ts";

// One segment per episode until they'd get too thin
const MAX_SEGMENTS = 60

export default function SeriesProgressCard({ title, progress }: { title: Title, progress: number }) {
    const percent = Math.round((progress / title.total) * 100)
    const next = episodeAt(title, progress + 1)
    const minutes = Array.from({ length: progress }, (_, i) => episodeAt(title, i + 1)?.minutes ?? 0).reduce((a, b) => a + b, 0)

    return (
        <section className="flex flex-col gap-4 rounded-xl border border-line p-6">
            <h2 className="m-0 text-[13px] font-semibold text-ink-muted uppercase">Part of your journey</h2>
            <div className="flex items-baseline justify-between">
                <p className="m-0 text-base text-ink">{progress} / {title.total} episodes watched</p>
                <p className="m-0 text-[14px] text-accent">{percent}%</p>
            </div>
            <div role="progressbar" aria-valuemin={0} aria-valuemax={title.total} aria-valuenow={progress} aria-label={`${title.title} progress`} className="flex gap-0.75">
                {title.total <= MAX_SEGMENTS
                    ? Array.from({ length: title.total }, (_, i) => (
                        <span key={i} className={`h-3 min-w-px flex-1 rounded-xs ${i < progress ? "bg-accent" : "bg-surface-raised"}`} />
                    ))
                    : <span className="h-3 flex-1 rounded-xs bg-surface-raised"><span className="block h-full rounded-xs bg-accent" style={{ width: `${percent}%` }} /></span>}
            </div>
            {minutes > 0 && (
                <div className="flex justify-between text-[14px]">
                    <p className="m-0 text-ink-muted">Time with this story</p>
                    <p className="m-0 text-ink-soft">{formatMinutes(minutes)}</p>
                </div>
            )}
            {next && (
                <>
                    <hr className="m-0 h-px border-0 bg-line" />
                    <Link to={episodePath(title.id, next.overall)} className="group flex items-center gap-2">
                        <span className="flex flex-1 flex-col gap-1.75">
                            <span className="text-[12px] text-ink-muted uppercase">Up next</span>
                            <span className="text-[15px] text-ink group-hover:text-accent">{shortName(next)}</span>
                        </span>
                        <Icon src="/episode-icons/arrow-right.svg" box="size-4" className="text-accent" />
                    </Link>
                </>
            )}
        </section>
    )
}
