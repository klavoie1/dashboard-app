import {useEffect, useMemo, useState} from "react";
import {Link, useSearchParams} from "react-router-dom";
import Icon from "../components/Icon.tsx";
import {
    CATEGORIES, STATUSES, coverOf, loadLibrary, logProgress, percentOf, progressText, quickStep, shortDay,
    statusLabel, typeOf, type MediaSummary,
} from "../components/library/media.ts";

const PAGE_SIZE = 12

const SORTS = {
    updated: { label: "Recently updated", compare: (a: MediaSummary, b: MediaSummary) => (b.lastActivityOn ?? "").localeCompare(a.lastActivityOn ?? "") || b.id - a.id },
    added: { label: "Recently added", compare: (a: MediaSummary, b: MediaSummary) => b.id - a.id },
    title: { label: "Title A–Z", compare: (a: MediaSummary, b: MediaSummary) => a.title.localeCompare(b.title) },
    rating: { label: "Your rating", compare: (a: MediaSummary, b: MediaSummary) => (b.rating ?? -1) - (a.rating ?? -1) },
}
type SortId = keyof typeof SORTS

const TAB = "flex h-full items-center gap-2 border-b-2 text-[15px] whitespace-nowrap transition-colors"

export default function LibraryPage() {
    const [params, setParams] = useSearchParams()
    const category = params.get("category") ?? "all"
    const status = params.get("status") ?? "all"
    const [media, setMedia] = useState<MediaSummary[] | null>(null)
    const [failed, setFailed] = useState(false)
    const [filter, setFilter] = useState("")
    const [sort, setSort] = useState<SortId>("updated")
    const [page, setPage] = useState(1)

    useEffect(() => { void loadLibrary().then(setMedia).catch(() => setFailed(true)) }, [])

    // Filters live in the URL, so the navbar tabs, shelves and Back all agree
    function setParam(key: string, value: string) {
        const next = new URLSearchParams(params)
        if (value === "all") next.delete(key)
        else next.set(key, value)
        setParams(next)
        setPage(1)
    }

    const all = media ?? []
    const kind = CATEGORIES.find((c) => c.id === category)?.kind
    const inCategory = kind ? all.filter((m) => m.kind === kind) : all
    const visible = useMemo(() => {
        const q = filter.trim().toLowerCase()
        return inCategory
            .filter((m) => status === "all" || m.status === status)
            .filter((m) => !q || `${m.title} ${m.subtitle ?? ""} ${m.creator ?? ""}`.toLowerCase().includes(q))
            .sort(SORTS[sort].compare)
    }, [inCategory, status, filter, sort])
    const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
    const shown = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    async function quickUpdate(m: MediaSummary) {
        const step = quickStep(m)
        if (!step) return
        const updated = await logProgress(m, step.progress, step.hours)
        setMedia((list) => list?.map((x) => (x.id === m.id ? { ...x, ...updated } : x)) ?? null)
    }

    return (
        <main className="flex flex-col pb-16">
            <section className="flex flex-col gap-7.5 pt-9">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex flex-col gap-2.25">
                        <p className="m-0 flex items-center gap-2.25 text-[13px] text-accent uppercase">
                            <span aria-hidden="true" className="block h-0.5 w-6 bg-accent" />
                            Your stories, all together
                        </p>
                        <h1 className="m-0 font-serif text-[44px] leading-[1.1] font-normal text-ink">My library</h1>
                        <p className="m-0 text-base text-ink-soft">
                            {media === null ? "Loading your titles…" : `${all.length} ${all.length === 1 ? "title" : "titles"}. Eight ways to get lost in a good story. One place to keep them.`}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {/* A plain link, so the browser saves the file the server sends */}
                        <a href="/api/export" download className="flex h-9.5 items-center gap-2 rounded-md border border-line bg-surface-raised px-3.5 text-[15px] font-semibold text-ink hover:border-accent">
                            Export library
                        </a>
                        <Link to="/search" className="flex h-9.5 items-center gap-2 rounded-md border border-accent bg-accent px-3.5 text-[15px] font-semibold text-bg hover:opacity-90">
                            <Icon src="/plus.svg" box="size-4" />
                            Add media
                        </Link>
                    </div>
                </div>

                <div className="flex min-h-13.5 flex-wrap items-center gap-x-7.5 border-b border-line">
                    <nav aria-label="Filter by status" className="flex h-13.5 gap-7.5 overflow-x-auto [scrollbar-width:none]">
                        {[{ id: "all", label: "All titles" }, ...STATUSES].map((s) => {
                            const active = status === s.id
                            const count = s.id === "all" ? inCategory.length : inCategory.filter((m) => m.status === s.id).length
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => setParam("status", s.id)}
                                    className={`${TAB} cursor-pointer ${active ? "border-accent font-semibold text-accent" : "border-transparent text-ink-soft hover:text-ink"}`}
                                >
                                    {s.label}
                                    <span className={`text-[14px] font-normal ${active ? "text-accent" : "text-ink-muted"}`}>{count}</span>
                                </button>
                            )
                        })}
                    </nav>
                    <p className="m-0 ml-auto hidden items-center gap-1.75 text-[14px] text-ink-muted md:flex">
                        <Icon src="/space-icons/lock-keyhole.svg" box="size-3.25" />
                        Your library is private
                    </p>
                </div>
            </section>

            <div className="grid gap-8 pt-7 lg:grid-cols-[12.75rem_minmax(0,1fr)]">
                <aside className="flex flex-col gap-7">
                    <div className="flex flex-col gap-3">
                        <h2 className="m-0 text-[13px] font-normal text-ink-muted uppercase">Media type</h2>
                        <ul className="m-0 flex list-none gap-0.5 overflow-x-auto p-0 lg:flex-col">
                            {[{ id: "all", label: "All media", icon: "/navbar-icons/category-all.svg", kind: null }, ...CATEGORIES].map((c) => {
                                const active = category === c.id
                                const count = c.kind ? all.filter((m) => m.kind === c.kind).length : all.length
                                return (
                                    <li key={c.id}>
                                        <button
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => setParam("category", c.id)}
                                            className={`flex h-9.75 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.75 text-left text-[15px] whitespace-nowrap transition-colors ${active ? "bg-accent-soft text-accent" : "text-ink-soft hover:bg-surface hover:text-ink"}`}
                                        >
                                            <Icon src={c.icon} box="size-3.75" />
                                            <span className="flex-1">{c.label}</span>
                                            <span className={`text-[14px] ${active ? "text-accent" : "text-ink-muted"}`}>{count}</span>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                    <hr className="m-0 hidden h-px border-0 bg-line lg:block" />
                    <div className="hidden flex-col gap-2 rounded-md bg-surface p-4 lg:flex">
                        <p className="m-0 font-serif text-[19px] text-ink">Make room for more.</p>
                        <p className="m-0 text-[14px] leading-[1.7] text-ink-muted">Search your sources and add a title in one step. Details and artwork come with it.</p>
                        <Link to="/search" className="text-[14px] text-accent hover:opacity-80">Find something new ↗</Link>
                    </div>
                </aside>

                <section className="flex min-w-0 flex-col gap-4.5">
                    <div className="flex flex-wrap gap-3">
                        <label className="flex h-10 min-w-48 flex-1 items-center gap-2.5 rounded-md border border-line bg-surface px-3.5 focus-within:border-accent">
                            <Icon src="/navbar-icons/search-icon.svg" box="size-4" className="text-ink-muted" />
                            <span className="sr-only">Filter your library</span>
                            <input
                                type="search"
                                value={filter}
                                onChange={(e) => { setFilter(e.target.value); setPage(1) }}
                                placeholder="Search your library by title or creator"
                                className="min-w-px flex-1 border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-muted"
                            />
                        </label>
                        <label className="flex h-10 items-center gap-2 rounded-md border border-line bg-surface px-3 text-[14px] text-ink-muted">
                            Sort
                            <select value={sort} onChange={(e) => setSort(e.target.value as SortId)} className="cursor-pointer bg-transparent text-ink [color-scheme:dark] focus:outline-none">
                                {Object.entries(SORTS).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
                            </select>
                        </label>
                    </div>

                    <div className="flex items-baseline gap-3">
                        <h2 className="m-0 font-serif text-[27px] font-normal text-ink">
                            {category === "all" ? "All your stories" : CATEGORIES.find((c) => c.id === category)?.label}
                        </h2>
                        <p className="m-0 text-[14px] text-ink-muted">{visible.length} {visible.length === 1 ? "title" : "titles"}</p>
                    </div>

                    {failed && <p role="alert" className="m-0 text-base text-ink">Couldn’t load your library. Check that the server is running.</p>}
                    {media !== null && visible.length === 0 && (
                        <div className="flex flex-col items-start gap-3 rounded-md border border-line p-6">
                            <p className="m-0 text-base text-ink-soft">
                                {all.length === 0 ? "Your library is empty. Add your first story to get started." : "Nothing here matches those filters."}
                            </p>
                            {all.length === 0 && <Link to="/search" className="text-[15px] text-accent hover:opacity-80">Find something to add</Link>}
                        </div>
                    )}

                    {shown.length > 0 && (
                        <div className="overflow-hidden rounded-md border border-line">
                            <div className="hidden grid-cols-[minmax(0,1fr)_7rem_13rem_4.5rem_5rem] gap-4 border-b border-line bg-surface px-4 py-3 text-[12px] text-ink-muted uppercase md:grid">
                                <span>Title</span><span>Status</span><span>Your progress</span><span>Rating</span><span>Updated</span>
                            </div>
                            <ul className="m-0 list-none p-0">
                                {shown.map((m) => {
                                    const step = quickStep(m)
                                    const percent = percentOf(m)
                                    const active = m.status === "in-progress"
                                    return (
                                        <li key={m.id} className="group relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 border-b border-line px-4 py-4 last:border-b-0 hover:bg-surface md:grid-cols-[minmax(0,1fr)_7rem_13rem_4.5rem_5rem] md:items-center">
                                            <div className="flex min-w-0 items-center gap-3.5">
                                                <img src={coverOf(m)} alt="" className="h-13 w-9 shrink-0 rounded-[3px] object-cover" />
                                                <div className="flex min-w-0 flex-col gap-1">
                                                    <p className="m-0 text-[12px] text-accent uppercase">{typeOf(m)}</p>
                                                    {/* ::after makes the whole row open the title; buttons sit above it */}
                                                    <Link to={`/library/${m.id}`} className="truncate text-base font-semibold text-ink after:absolute after:inset-0 group-hover:text-accent">
                                                        {m.title}
                                                    </Link>
                                                    <p className="m-0 truncate text-[13px] text-ink-muted">{[m.creator, m.releaseYear].filter(Boolean).join(" · ")}</p>
                                                </div>
                                            </div>
                                            <p className={`m-0 flex items-center gap-2 text-[14px] ${active ? "text-accent" : "text-ink-soft"}`}>
                                                <span aria-hidden="true" className={`block size-1.25 rounded-full ${active ? "bg-accent" : "bg-ink-muted"}`} />
                                                {statusLabel(m)}
                                            </p>
                                            <div className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
                                                <p className="m-0 text-[14px] text-ink">{progressText(m)}</p>
                                                <div className="h-1 overflow-hidden rounded bg-line" aria-hidden="true">
                                                    <div className={`h-full rounded ${m.status === "finished" ? "bg-ink-muted" : "bg-accent"}`} style={{ width: `${percent}%` }} />
                                                </div>
                                                {m.status === "finished" ? (
                                                    <p className="m-0 text-[13px] text-ink-muted">Finished {shortDay(m.finishedOn)}</p>
                                                ) : step && (
                                                    <button type="button" onClick={() => void quickUpdate(m)} className="relative z-10 cursor-pointer self-start text-[13px] text-accent hover:opacity-80">
                                                        {step.label}
                                                    </button>
                                                )}
                                            </div>
                                            <p className="m-0 hidden items-center gap-1.5 text-[15px] text-ink md:flex">
                                                <Icon src="/icons/star.svg" box="size-3.5" className={m.rating ? "text-accent" : "text-ink-muted"} />
                                                {m.rating?.toFixed(1) ?? "—"}
                                            </p>
                                            <p className="m-0 hidden text-[14px] text-ink-muted md:block">{shortDay(m.lastActivityOn)}</p>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}

                    {pages > 1 && (
                        <nav aria-label="Library pages" className="flex flex-wrap items-center justify-between gap-3">
                            <p className="m-0 text-[14px] text-ink-muted">
                                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, visible.length)} of {visible.length} titles
                            </p>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        aria-current={n === page ? "page" : undefined}
                                        onClick={() => setPage(n)}
                                        className="size-8.5 cursor-pointer rounded-md text-[14px] text-ink-soft hover:text-ink aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent"
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </nav>
                    )}
                </section>
            </div>
        </main>
    )
}
