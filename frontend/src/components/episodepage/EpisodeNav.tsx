import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import {episodeAt, episodePath, type Title} from "../mediapage/titles.ts";
import {shortName} from "./format.ts";

export default function EpisodeNav({ title, overall, progress, seriesLink }: { title: Title, overall: number, progress: number, seriesLink: string }) {
    const prev = episodeAt(title, overall - 1)
    const next = episodeAt(title, overall + 1)

    function status(n: number, minutes?: number) {
        if (n <= progress) {
            const rating = title.episodeInfo?.[n]?.yourRating
            return { text: `Watched${rating ? ` · Your rating ${rating.toFixed(1)}` : ""}`, done: true }
        }
        return { text: [n === progress + 1 ? "Up next" : "Not watched", minutes && `${minutes} min`].filter(Boolean).join(" · "), done: false }
    }

    const card = "flex min-w-0 flex-1 items-center gap-4.5 rounded-md border border-line p-5.5 transition-colors hover:border-accent"

    return (
        <nav aria-label="More episodes" className="flex flex-col items-stretch gap-6 md:flex-row md:items-center">
            {prev ? (
                <Link to={episodePath(title.id, prev.overall)} className={card}>
                    <Icon src="/episode-icons/arrow-left.svg" box="size-5" className="text-accent" />
                    <span className="flex min-w-0 flex-col gap-2">
                        <span className="text-[12px] font-semibold text-ink-muted uppercase">Previous episode</span>
                        <span className="font-serif text-[23px] text-ink">{shortName(prev)}</span>
                        <span className={`text-[13px] ${status(prev.overall).done ? "text-accent" : "text-ink-muted"}`}>{status(prev.overall, prev.minutes).text}</span>
                    </span>
                </Link>
            ) : <span className="hidden flex-1 md:block" />}

            <Link to={seriesLink} className="flex shrink-0 flex-col items-center gap-2.5 text-[14px] text-accent hover:opacity-80 md:w-38">
                <Icon src="/episode-icons/grid-2x2.svg" box="size-4.75" />
                All {title.total} episodes
            </Link>

            {next ? (
                <Link to={episodePath(title.id, next.overall)} className={`${card} justify-end text-right`}>
                    <span className="flex min-w-0 flex-col items-end gap-2">
                        <span className="text-[12px] font-semibold text-ink-muted uppercase">Next episode</span>
                        <span className="font-serif text-[23px] text-ink">{shortName(next)}</span>
                        <span className={`text-[13px] ${status(next.overall).done ? "text-accent" : "text-ink-muted"}`}>{status(next.overall, next.minutes).text}</span>
                    </span>
                    <Icon src="/episode-icons/arrow-right.svg" box="size-5" className="text-accent" />
                </Link>
            ) : <span className="hidden flex-1 md:block" />}
        </nav>
    )
}
