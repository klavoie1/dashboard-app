import {type FormEvent, useEffect, useMemo, useRef, useState} from "react";
import {Link, useNavigate, useSearchParams} from "react-router-dom";
import {api} from "../api.ts";
import Icon from "../components/Icon.tsx";
import CharacterCard from "../components/characters/CharacterCard.tsx";
import {loadCharacters, setFavorite, type Character} from "../components/characters/characterApi.ts";
import {CATEGORIES, coverOf, loadLibrary, statusLabel, typeOf, type MediaSummary} from "../components/library/media.ts";
import {KIND_TO_TYPE} from "../components/mediapage/titleApi.ts";

const PAGE_SIZE = 12

// Main characters, then supporting, then background
const rank = (c: Character) => Math.min(...c.appearances.map((a) => (a.role === "MAIN" ? 0 : a.role === "SUPPORTING" ? 1 : 2)), 3)

const SORTS = {
    main: { label: "Main characters first", compare: (a: Character, b: Character) => rank(a) - rank(b) || a.name.localeCompare(b.name) },
    name: { label: "Name A–Z", compare: (a: Character, b: Character) => a.name.localeCompare(b.name) },
    added: { label: "Recently added", compare: (a: Character, b: Character) => b.id - a.id },
    appearances: { label: "Most appearances", compare: (a: Character, b: Character) => b.appearances.length - a.appearances.length || a.name.localeCompare(b.name) },
}
type SortId = keyof typeof SORTS

const TAB = "flex h-full items-center gap-2 border-b-2 text-[15px] whitespace-nowrap transition-colors"

export default function Characters() {
    const [params, setParams] = useSearchParams()
    const navigate = useNavigate()
    const mediaFilter = params.get("media") ? Number(params.get("media")) : null
    const category = params.get("category") ?? "all"
    const tab = params.get("tab") === "favorites" ? "favorites" : "all"
    const [characters, setCharacters] = useState<Character[] | null>(null)
    const [library, setLibrary] = useState<MediaSummary[]>([])
    const [failed, setFailed] = useState(false)
    const [filter, setFilter] = useState("")
    const [sort, setSort] = useState<SortId>("main")
    const [page, setPage] = useState(1)
    const [adding, setAdding] = useState(false)
    const galleryRef = useRef<HTMLElement>(null)

    useEffect(() => {
        void loadCharacters().then(setCharacters).catch(() => setFailed(true))
        void loadLibrary().then(setLibrary).catch(() => {})
    }, [])

    function setParam(key: string, value: string | null) {
        const next = new URLSearchParams(params)
        if (value === null || value === "all") next.delete(key)
        else next.set(key, value)
        setParams(next)
        setPage(1)
    }

    async function toggleFavorite(c: Character) {
        const updated = await setFavorite(c, !c.favorite)
        setCharacters((list) => list?.map((x) => (x.id === c.id ? updated : x)) ?? null)
    }

    const all = useMemo(() => characters ?? [], [characters])
    const kind = CATEGORIES.find((c) => c.id === category)?.kind
    const visible = useMemo(() => {
        const q = filter.trim().toLowerCase()
        return all
            .filter((c) => tab === "all" || c.favorite)
            .filter((c) => mediaFilter === null || c.appearances.some((a) => a.mediaId === mediaFilter))
            .filter((c) => !kind || c.appearances.some((a) => a.mediaKind === kind))
            .filter((c) => !q || `${c.name} ${c.nativeName ?? ""} ${c.role ?? ""} ${c.appearances.map((a) => `${a.mediaTitle} ${a.actor ?? ""}`).join(" ")}`.toLowerCase().includes(q))
            .sort(SORTS[sort].compare)
    }, [all, tab, mediaFilter, kind, filter, sort])
    const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
    const shown = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const favorites = all.filter((c) => c.favorite).length
    const filteredTitle = mediaFilter !== null ? all.flatMap((c) => c.appearances).find((a) => a.mediaId === mediaFilter)?.mediaTitle : null

    // The featured world: the title you updated most recently that has characters
    const withCast = new Set(all.flatMap((c) => c.appearances.map((a) => a.mediaId)))
    const featured = [...library]
        .filter((m) => withCast.has(m.id))
        .sort((a, b) => (b.lastActivityOn ?? "").localeCompare(a.lastActivityOn ?? ""))[0]
    const featuredNames = featured ? all.filter((c) => c.appearances.some((a) => a.mediaId === featured.id && a.role === "MAIN")).slice(0, 3).map((c) => c.name) : []
    const featuredKinds = featured ? [...new Set(all.filter((c) => c.appearances.some((a) => a.mediaId === featured.id))
        .flatMap((c) => c.appearances.map((a) => KIND_TO_TYPE[a.mediaKind])))].join(" · ") : ""

    function explore(mediaId: number) {
        setParam("media", String(mediaId))
        galleryRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    return (
        <main className="flex flex-col pb-16">
            <section className="flex flex-wrap items-center justify-between gap-6 pt-9 pb-7.5">
                <div className="flex flex-col gap-2.25">
                    <p className="m-0 flex items-center gap-2.5 text-[13px] text-accent uppercase">
                        <span aria-hidden="true" className="block h-0.5 w-6 bg-accent" />
                        The people behind your stories
                    </p>
                    <h1 className="m-0 font-serif text-[44px] leading-[1.1] font-normal text-ink">Characters</h1>
                    <p className="m-0 text-base text-ink-soft">Some stories stay with you. So do the people in them.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => setAdding(true)} className="flex h-9.5 cursor-pointer items-center gap-2 rounded-md border border-line bg-surface-raised px-3.5 text-[15px] font-semibold text-ink hover:border-accent">
                        <Icon src="/plus.svg" box="size-4" />
                        Add a character
                    </button>
                    <button type="button" onClick={() => setParam("tab", "favorites")} className="flex h-9.5 cursor-pointer items-center gap-2 rounded-md border border-line bg-surface-raised px-3.5 text-[15px] font-semibold text-ink hover:border-accent">
                        <Icon src="/episode-icons/heart.svg" box="size-4" />
                        My favorites · {favorites}
                    </button>
                </div>
            </section>

            {featured && (
                <section className="relative -mx-4 flex min-h-112 flex-col justify-center overflow-hidden px-4 py-8.5 md:mx-0 md:px-8 xl:px-16">
                    <img src={featured.backdrop ?? coverOf(featured)} alt="" className={`absolute inset-0 size-full object-cover ${featured.backdrop ? "" : "scale-110 blur-2xl brightness-50"}`} style={{ objectPosition: featured.backdropPosition ?? undefined }} />
                    <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(90deg, rgb(17, 20, 18) 0%, rgba(17, 20, 18, 0.933) 32%, rgba(17, 20, 18, 0.133) 70%, rgba(17, 20, 18, 0) 100%)" }} />
                    <div className="absolute inset-0 bg-linear-to-b from-transparent from-50% to-bg" />
                    <div className="relative flex max-w-130 flex-col items-start gap-4">
                        <p className="m-0 flex items-center gap-2.5 text-[13px] text-accent uppercase">
                            <span aria-hidden="true" className="block h-0.5 w-6 bg-accent" />
                            From a world you’re exploring
                        </p>
                        <h2 className="m-0 font-serif text-[42px] leading-[1.12] font-normal text-ink">The people along the way.</h2>
                        <p className="m-0 max-w-107.5 text-base leading-[1.7] text-ink-soft">
                            {featuredNames.length ? `${featuredNames.join(", ")} and more. ` : ""}Get to know the companions of {featured.title}.
                        </p>
                        <div className="flex flex-wrap items-center gap-5">
                            <button type="button" onClick={() => explore(featured.id)} className="flex h-9.5 cursor-pointer items-center gap-2 rounded-md border border-accent bg-accent px-3.5 text-[15px] font-semibold text-bg hover:opacity-90">
                                <Icon src="/episode-icons/users.svg" box="size-4" />
                                Explore the characters
                            </button>
                            <p className="m-0 text-[14px] text-ink-soft">{featuredKinds}</p>
                        </div>
                    </div>
                    <p className="absolute right-4 bottom-7 m-0 hidden items-center gap-2 text-[13px] text-ink uppercase md:right-8 md:flex xl:right-16">
                        <span aria-hidden="true" className="block size-1.25 rounded-full bg-accent" />
                        In your library · {statusLabel(featured)}
                    </p>
                </section>
            )}

            <section ref={galleryRef} className="scroll-mt-24 pt-3">
                <div className="flex min-h-13.5 flex-wrap items-center gap-x-7.5 border-b border-line">
                    <nav aria-label="Character collections" className="flex h-13.5 gap-7.5">
                        {[{ id: "all", label: "Explore characters", count: all.length }, { id: "favorites", label: "Favorites", count: favorites }].map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                aria-pressed={tab === t.id}
                                onClick={() => setParam("tab", t.id)}
                                className={`${TAB} cursor-pointer ${tab === t.id ? "border-accent font-semibold text-accent" : "border-transparent text-ink-soft hover:text-ink"}`}
                            >
                                {t.label}
                                <span className={`text-[14px] font-normal ${tab === t.id ? "text-accent" : "text-ink-muted"}`}>{t.count}</span>
                            </button>
                        ))}
                    </nav>
                    <p className="m-0 ml-auto hidden items-center gap-1.75 text-[14px] text-ink-muted md:flex">
                        <Icon src="/episode-icons/shield-check.svg" box="size-3.5" />
                        Keeping your discoveries spoiler-free
                    </p>
                </div>

                <div className="grid gap-8 pt-7 lg:grid-cols-[12.75rem_minmax(0,1fr)]">
                    <aside className="flex flex-col gap-6">
                        <div className="flex flex-col gap-3">
                            <h2 className="m-0 text-[13px] font-normal text-ink-muted uppercase">Appears in</h2>
                            <ul className="m-0 flex list-none gap-0.5 overflow-x-auto p-0 lg:flex-col">
                                {[{ id: "all", label: "All media", icon: "/navbar-icons/category-all.svg", kind: null }, ...CATEGORIES].map((c) => {
                                    const active = category === c.id
                                    const count = c.kind ? all.filter((x) => x.appearances.some((a) => a.mediaKind === c.kind)).length : all.length
                                    return (
                                        <li key={c.id}>
                                            <button
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() => setParam("category", c.id)}
                                                className={`flex h-9.25 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.75 text-left text-[15px] whitespace-nowrap transition-colors ${active ? "bg-accent-soft text-accent" : "text-ink-soft hover:bg-surface hover:text-ink"}`}
                                            >
                                                <Icon src={c.icon} box="size-4" />
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
                            <p className="m-0 font-serif text-[19px] text-ink">Meet the cast.</p>
                            <p className="m-0 text-[14px] leading-[1.7] text-ink-muted">Open any title and fetch its characters. Portraits and voice actors come with them.</p>
                            <Link to="/library" className="text-[14px] text-accent hover:opacity-80">Go to your library ↗</Link>
                        </div>
                    </aside>

                    <div className="flex min-w-0 flex-col gap-4.5">
                        <div className="flex flex-wrap gap-3">
                            <label className="flex h-10 min-w-48 flex-1 items-center gap-2.5 rounded-md border border-line bg-surface px-3.5 focus-within:border-accent">
                                <Icon src="/navbar-icons/search-icon.svg" box="size-4" className="text-ink-muted" />
                                <span className="sr-only">Search characters</span>
                                <input type="search" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1) }} placeholder="Search by name, title or voice actor" className="min-w-px flex-1 border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-muted" />
                            </label>
                            <label className="flex h-10 items-center gap-2 rounded-md border border-line bg-surface px-3 text-[14px] text-ink-muted">
                                Sort
                                <select value={sort} onChange={(e) => setSort(e.target.value as SortId)} className="cursor-pointer bg-transparent text-ink [color-scheme:dark] focus:outline-none">
                                    {Object.entries(SORTS).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
                                </select>
                            </label>
                        </div>

                        <div className="flex flex-wrap items-baseline gap-3">
                            <h2 className="m-0 font-serif text-3xl font-normal text-ink">{tab === "favorites" ? "Your favorites" : "Everyone you’ve met so far"}</h2>
                            <p className="m-0 text-[14px] text-ink-muted">{visible.length} {visible.length === 1 ? "character" : "characters"}</p>
                        </div>
                        {filteredTitle && (
                            <p className="m-0 flex items-center gap-2 self-start rounded-md bg-accent-soft px-3 py-1.5 text-[14px] text-accent">
                                From {filteredTitle}
                                <button type="button" aria-label="Show characters from every title" onClick={() => setParam("media", null)} className="flex cursor-pointer">
                                    <Icon src="/x.svg" box="size-3.5" />
                                </button>
                            </p>
                        )}

                        {failed && <p role="alert" className="m-0 text-base text-ink">Couldn’t load characters. Check that the server is running.</p>}
                        {characters !== null && visible.length === 0 && (
                            <p className="m-0 text-base text-ink-muted">
                                {all.length === 0 ? "No characters yet. Open a title in your library and fetch its cast." : tab === "favorites" ? "No favorites yet. Tap the heart on a character to keep them here." : "Nobody matches those filters."}
                            </p>
                        )}

                        <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 md:grid-cols-3 xl:grid-cols-4">
                            {shown.map((c) => (
                                <li key={c.id}><CharacterCard character={c} mediaId={mediaFilter ?? undefined} onFavorite={(x) => void toggleFavorite(x)} /></li>
                            ))}
                        </ul>

                        {pages > 1 && (
                            <nav aria-label="Character pages" className="flex flex-wrap items-center justify-between gap-3">
                                <p className="m-0 text-[14px] text-ink-muted">
                                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, visible.length)} of {visible.length} characters
                                </p>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                                        <button key={n} type="button" aria-current={n === page ? "page" : undefined} onClick={() => setPage(n)} className="size-8.5 cursor-pointer rounded-md text-[14px] text-ink-soft hover:text-ink aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent">
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </nav>
                        )}
                    </div>
                </div>
            </section>

            <AddCharacterDialog open={adding} library={library} onClose={() => setAdding(false)} onCreated={(c) => navigate(`/characters/${c.id}`)} />
        </main>
    )
}

// A character you add yourself: a name and, optionally, the title they're from
function AddCharacterDialog({ open, library, onClose, onCreated }: {
    open: boolean
    library: MediaSummary[]
    onClose: () => void
    onCreated: (c: Character) => void
}) {
    const ref = useRef<HTMLDialogElement>(null)
    const [name, setName] = useState("")
    const [mediaId, setMediaId] = useState("")
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const dialog = ref.current
        if (!dialog) return
        if (open && !dialog.open) {
            setName("")
            setMediaId("")
            setError(null)
            dialog.showModal()
        } else if (!open && dialog.open) {
            dialog.close()
        }
    }, [open])

    async function submit(e: FormEvent) {
        e.preventDefault()
        try {
            const { data } = await api.post<Character>("/characters", { name, mediaIds: mediaId ? [Number(mediaId)] : [] })
            onCreated(data)
        } catch {
            setError("Couldn’t add that character.")
        }
    }

    const field = "rounded-md border border-line bg-bg px-3 py-2 text-[15px] text-ink focus:border-accent focus:outline-none"
    return (
        <dialog ref={ref} onClose={onClose} aria-labelledby="add-character-heading" className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink [color-scheme:dark] backdrop:bg-black/70">
            <form onSubmit={submit} className="flex flex-col gap-4 p-6">
                <h2 id="add-character-heading" className="m-0 font-serif text-[27px] font-normal">Add a character</h2>
                <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted">
                    Name
                    <input required value={name} onChange={(e) => setName(e.target.value)} className={field} />
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted">
                    From (optional)
                    <select value={mediaId} onChange={(e) => setMediaId(e.target.value)} className={field}>
                        <option value="">Not tied to a title</option>
                        {library.map((m) => <option key={m.id} value={m.id}>{m.title} · {typeOf(m)}</option>)}
                    </select>
                </label>
                <p className="m-0 text-[13px] text-ink-muted">You can add a portrait, details and sources on the next page.</p>
                <div className="flex items-center justify-end gap-3">
                    {error && <p role="alert" className="m-0 mr-auto text-[14px] text-ink">{error}</p>}
                    <button type="button" onClick={onClose} className="cursor-pointer rounded-md border border-line px-3 py-2 text-[14px] text-ink hover:border-accent">Cancel</button>
                    <button type="submit" className="cursor-pointer rounded-md border border-accent bg-accent px-4 py-2 text-[14px] font-semibold text-bg hover:opacity-90">Add character</button>
                </div>
            </form>
        </dialog>
    )
}
