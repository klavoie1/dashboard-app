import {type ReactNode, useState} from "react";
import {Link} from "react-router-dom";
import Icon from "../../Icon.tsx";
import SectionHeading from "./SectionHeading.tsx";

type Filter = "all" | "done" | "todo"

// Rows shown around your progress before "View all"
const WINDOW = 6

type UnitListProps = {
    heading: string
    // "Episode" or "Volume"
    noun: string
    total: number
    done: number
    onChange: (done: number) => void
    doneLabel: string
    todoLabel: string
    titleFor: (n: number) => string
    metaFor?: (n: number) => string | undefined
    thumbnail?: string
    // Extra heading text, e.g. "Season 2 · 10 episodes"
    countLabel?: string
    // Rendered above the filters, e.g. a season picker
    controls?: ReactNode
    // Makes each row open its own page, e.g. an episode
    hrefFor?: (n: number) => string
}

export default function UnitList({ heading, noun, total, done, onChange, doneLabel, todoLabel, titleFor, metaFor, thumbnail, countLabel, controls, hrefFor }: UnitListProps) {
    const [filter, setFilter] = useState<Filter>("all")
    const [showAll, setShowAll] = useState(false)
    const plural = `${noun.toLowerCase()}s`

    const all = Array.from({ length: total }, (_, i) => i + 1)
    const filtered = all.filter((n) => filter === "all" || (filter === "done" ? n <= done : n > done))
    // Starts one row before the next unit so you see where you left off
    const start = filter === "all" ? Math.max(0, Math.min(done - 1, total - WINDOW)) : 0
    const rows = showAll ? filtered : filtered.slice(start, start + WINDOW)

    const filters: { id: Filter, label: string, count: number }[] = [
        { id: "all", label: `All ${plural}`, count: total },
        { id: "done", label: doneLabel, count: done },
        { id: "todo", label: todoLabel, count: total - done },
    ]

    return (
        <section className="flex flex-col gap-5">
            <SectionHeading title={heading} count={countLabel ?? `${total} ${plural}`} />
            {controls}

            <div role="group" aria-label={`Filter ${plural}`} className="flex gap-1 self-start rounded-md bg-surface p-1">
                {filters.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        aria-pressed={filter === f.id}
                        onClick={() => setFilter(f.id)}
                        className="cursor-pointer rounded px-3 py-2 text-[14px] whitespace-pre text-ink-muted transition-colors hover:text-ink aria-pressed:bg-surface-raised aria-pressed:text-ink"
                    >
                        {`${f.label}  ${f.count}`}
                    </button>
                ))}
            </div>

            <ol className="m-0 flex list-none flex-col gap-1 p-0">
                {rows.map((n) => {
                    const watched = n <= done
                    const next = n === done + 1
                    const name = titleFor(n)
                    const meta = metaFor?.(n)
                    return (
                        <li
                            key={n}
                            className={`relative flex min-h-24 items-center gap-3.5 px-4 py-3 ${
                                next ? "rounded-md border border-accent/40 bg-accent-soft" : "border-b border-line bg-surface"
                            }`}
                        >
                            <button
                                type="button"
                                aria-pressed={watched}
                                aria-label={`${noun} ${n}: ${name}`}
                                // Marks everything up to this one; unticking steps back to just before it
                                onClick={() => onChange(watched ? n - 1 : n)}
                                className={`relative z-10 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors ${
                                    watched ? "border-accent bg-accent text-bg" : "border-ink-muted hover:border-accent"
                                }`}
                            >
                                {watched && <Icon src="/featured/check.svg" box="size-3.5" />}
                            </button>
                            <p className={`m-0 w-7 shrink-0 text-[15px] ${next ? "text-accent" : "text-ink-muted"}`}>{String(n).padStart(2, "0")}</p>
                            {thumbnail && <img src={thumbnail} alt="" className="h-15.5 w-11 shrink-0 rounded object-cover" />}
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                {hrefFor ? (
                                    // ::after stretches the link over the row; the checkbox sits above it
                                    <Link to={hrefFor(n)} className="text-base font-semibold text-ink after:absolute after:inset-0 hover:text-accent">{name}</Link>
                                ) : (
                                    <p className="m-0 text-base font-semibold text-ink">{name}</p>
                                )}
                                {meta && <p className="m-0 text-[14px] whitespace-pre text-ink-muted">{meta}</p>}
                            </div>
                            <p className={`m-0 w-28 shrink-0 text-[14px] ${next ? "text-[13px] font-semibold text-accent" : watched ? "text-ink-soft" : "text-ink-muted"}`}>
                                {next ? "UP NEXT" : watched ? doneLabel : `Not ${doneLabel.toLowerCase()}`}
                            </p>
                        </li>
                    )
                })}
            </ol>

            {filtered.length > WINDOW && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="m-0 text-[14px] text-ink-muted">
                        {showAll
                            ? `Showing all ${filtered.length}`
                            : `Showing ${filtered.indexOf(rows[0]) + 1}–${filtered.indexOf(rows[rows.length - 1]) + 1} of ${filtered.length}${filter === "all" ? " · Around your progress" : ""}`}
                    </p>
                    <button type="button" onClick={() => setShowAll((v) => !v)} className="cursor-pointer text-[15px] text-accent transition-opacity hover:opacity-80">
                        {showAll ? "Show fewer" : `View all ${plural}`}
                    </button>
                </div>
            )}
        </section>
    )
}
