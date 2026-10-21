import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import MediaCard, {type MediaCardProps} from "./MediaCard.tsx";
import {useState} from "react";
import {activeVerb, coverOf, quickStep, typeOf, unitOf, updatedText, type MediaSummary} from "../library/media.ts";

type Category = 'Watching' | 'Reading' | 'Playing' | 'Listening';
type Filter = "All" | Category
type Story = MediaCardProps & {
    id: number
    category: Category
}

const FILTERS: Filter[] = ["All", "Watching", "Reading", "Playing", "Listening"]

// Every in-progress title as a card, most recently updated first
function toStories(media: MediaSummary[], onLog: (m: MediaSummary) => void): Story[] {
    return media
        .filter((m) => m.status === "in-progress")
        .sort((a, b) => (b.lastActivityOn ?? "").localeCompare(a.lastActivityOn ?? ""))
        .map((m) => {
            const step = quickStep(m)
            const percent = unitOf(m) === "percent" || m.kind === "game"
            const minutes = unitOf(m) === "minutes"
            return {
                id: m.id,
                to: `/library/${m.id}`,
                category: activeVerb(m) as Category,
                type: typeOf(m),
                title: m.title,
                creator: m.creator ?? "",
                cover: coverOf(m),
                progress: m.progress,
                total: percent ? 100 : m.total ?? 0,
                unit: percent ? "%" : minutes ? "min" : unitOf(m),
                hint: updatedText(m.lastActivityOn),
                actionLabel: step?.label ?? "Open",
                onAction: step ? () => onLog(m) : undefined,
            }
        })
}

export default function ContinueStories({ media, onLog, viewTo = "/library?status=in-progress" }: {
    media: MediaSummary[] | null
    onLog: (m: MediaSummary) => void
    viewTo?: string
}) {
    const [filter, setFilter] = useState<"All" | Category>("All")
    const STORIES = toStories(media ?? [], onLog)
    const countFor = (f: Filter) => (f === "All" ? STORIES.length : STORIES.filter((story) => story.category === f).length)
    const visible = filter === "All" ? STORIES : STORIES.filter((story) => story.category === filter)

    return (
        <section className="flex flex-col gap-6 pt-10">

            {/* Title Section */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                    <h2 className="m-0 font-serif text-3xl font-normal text-ink">
                        A little further into your worlds
                    </h2>
                    <p className="m-0 text-[15px] text-ink-muted">
                        Continue watching, reading, playing, and listening
                    </p>
                </div>
                <Link to={viewTo} className="flex items-center gap-2 text-[14px] text-accent transition-opacity hover:opacity-80">
                    View in-progress library
                    <Icon src="/featured/arrow-up-right.svg" box="size-[13px]" />
                </Link>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div role="group" aria-label="Filter stories" className="flex flex-wrap gap-2">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            type="button"
                            aria-pressed={filter === f}
                            onClick={() => setFilter(f)}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3.25 py-2 text-[14px] transition-colors ${
                                filter === f
                                    ? "bg-accent-soft text-accent"
                                    : "bg-surface text-ink-soft hover:text-ink"
                            }`}
                        >
                            {f === "All" ? "All in progress" : f}
                            <span className="opacity-70">{countFor(f)}</span>
                        </button>
                    ))}
                </div>

                {/* Static until sorting is added */}
                <p className="m-0 flex items-center gap-1.5 text-[14px] text-ink-muted">
                    <Icon src="/arrow-down-wide-narrow.svg" box="size-3.5" />
                    Recently updated
                </p>
            </div>

            {media !== null && STORIES.length === 0 && (
                <p className="m-0 text-base text-ink-muted">
                    Nothing in progress. Start something from <Link to="/library?status=want" className="text-accent hover:opacity-80">your “for later” list</Link>.
                </p>
            )}

            {/* Media Cards */}
            <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
                {visible.map((story) => (
                    <li key={story.id}>
                        <MediaCard {...story} />
                    </li>
                ))}
            </ul>
        </section>
    )
}
