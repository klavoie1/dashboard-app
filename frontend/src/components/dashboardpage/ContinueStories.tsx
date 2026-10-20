import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import MediaCard, {type MediaCardProps} from "./MediaCard.tsx";
import {useState} from "react";

// Placeholder data until the backend stores covers, creators and progress
const PLACEHOLDER_COVER = "/featured/frieren.jpg"

type Category = 'Watching' | 'Reading' | 'Playing' | 'Listening';
type Filter = "All" | Category

type Story = MediaCardProps & {
    category: Category
}

const STORIES: Story[] = [
    { type: "Anime", category: "Watching", title: "Frieren: Beyond Journey's End", creator: "Kanehito Yamada", cover: PLACEHOLDER_COVER, progress: 6, total: 28, unit: "episodes", hint: "Next: Like a Fairy Tale", actionLabel: "Mark episode watched" },
    { type: "Book", category: "Reading", title: "The Name of the Wind", creator: "Patrick Rothfuss", cover: PLACEHOLDER_COVER, progress: 212, total: 662, unit: "pages", hint: "About 7 hours left", actionLabel: "Log pages" },
    { type: "Game", category: "Playing", title: "Hollow Knight", creator: "Team Cherry", cover: PLACEHOLDER_COVER, progress: 42, total: 100, unit: "%", hint: "Last played 3 days ago", actionLabel: "Log session" },
    { type: "Manga", category: "Reading", title: "Vinland Saga", creator: "Makoto Yukimura", cover: PLACEHOLDER_COVER, progress: 54, total: 214, unit: "chapters", hint: "Next: Chapter 55", actionLabel: "Mark chapter read" },
    { type: "TV Show", category: "Watching", title: "Severance", creator: "Dan Erickson", cover: PLACEHOLDER_COVER, progress: 4, total: 19, unit: "episodes", hint: "Next: S1 E5", actionLabel: "Mark episode watched" },
    { type: "Audiobook", category: "Listening", title: "Project Hail Mary", creator: "Andy Weir", cover: PLACEHOLDER_COVER, progress: 5, total: 16, unit: "hours", hint: "About 11 hours left", actionLabel: "Log listening" },
    { type: "Book", category: "Reading", title: "Piranesi", creator: "Susanna Clarke", cover: PLACEHOLDER_COVER, progress: 88, total: 272, unit: "pages", hint: "About 4 hours left", actionLabel: "Log pages" },
    { type: "Anime", category: "Watching", title: "Mushishi", creator: "Yuki Urushibara", cover: PLACEHOLDER_COVER, progress: 11, total: 26, unit: "episodes", hint: "Next: The Sound of Rust", actionLabel: "Mark episode watched" },
]

const FILTERS: Filter[] = ["All", "Watching", "Reading", "Playing", "Listening"]

function countFor(f: "All" | Category) {
    if (f === "All") return STORIES.length
    return STORIES.filter((story) => story.category === f).length
}

export default function ContinueStories({ viewTo = "/library" }: { viewTo?: string }) {
    const [filter, setFilter] = useState<"All" | Category>("All")

    const visible = filter === "All" ? STORIES : STORIES.filter((story) => story.category === filter)

    return (
        <section className="flex flex-col gap-6 pt-10">

            {/* Title Section */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="m-0 font-serif text-3xl font-normal text-ink">
                        A little further into your worlds
                    </h2>
                    <p className="m-0 text-xs text-ink-muted">
                        Continue watching, reading, playing, and listening
                    </p>
                </div>
                <Link to={viewTo} className="flex items-center gap-1.5 text-[11px] text-accent transition-opacity hover:opacity-80">
                    View in-progress library
                    <Icon src="/featured/arrow-up-right.svg" box="size-3.5" />
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
                            className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3.25 py-2 text-[11px] transition-colors ${
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
                <p className="m-0 flex items-center gap-1.5 text-[11px] text-ink-muted">
                    <Icon src="/arrow-down-wide-narrow.svg" box="size-3.5" />
                    Recently updated
                </p>
            </div>

            {/* Media Cards */}
            <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
                {visible.map((story) => (
                    <li key={story.title}>
                        <MediaCard {...story} />
                    </li>
                ))}
            </ul>
        </section>
    )
}
