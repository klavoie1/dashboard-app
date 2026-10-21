import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import Icon from "../components/Icon.tsx";
import DiscoverCard from "../components/discover/DiscoverCard.tsx";
import {addToLibrary, loadDiscover, type Discover, type Hit} from "../components/discover/discoverApi.ts";
import {PROVIDER_NAMES, type Provider} from "../components/mediapage/titles.ts";

const CHIP = "flex cursor-pointer items-center gap-1.5 rounded-md px-3.25 py-2 text-[14px] text-ink-soft transition-colors hover:text-ink aria-pressed:bg-accent-soft aria-pressed:text-accent"

export default function DiscoverPage() {
    const [data, setData] = useState<Discover | null>(null)
    const [failed, setFailed] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [kind, setKind] = useState("all")
    // Suggestions you added on this page, so their cards switch to "In your library"
    const [added, setAdded] = useState<Record<string, number>>({})
    const [adding, setAdding] = useState<string | null>(null)

    useEffect(() => { void loadDiscover().then(setData).catch(() => setFailed(true)) }, [])

    async function refresh() {
        setRefreshing(true)
        try {
            setData(await loadDiscover(true))
        } catch {
            setFailed(true)
        } finally {
            setRefreshing(false)
        }
    }

    async function add(hit: Hit) {
        const key = `${hit.provider}:${hit.externalId}`
        setAdding(key)
        try {
            const id = await addToLibrary(hit)
            setAdded((a) => ({ ...a, [key]: id }))
        } finally {
            setAdding(null)
        }
    }

    const kinds = [...new Set(data?.shelves.flatMap((s) => s.items.map((i) => i.hit.kind)) ?? [])]
    const shelves = (data?.shelves ?? [])
        .map((s) => ({ ...s, items: s.items.filter((i) => kind === "all" || i.hit.kind === kind) }))
        .filter((s) => s.items.length > 0)
    const problems = Object.entries(data?.problems ?? {})

    return (
        <main className="flex flex-col gap-8 py-9">
            <section className="flex flex-wrap items-end justify-between gap-6">
                <div className="flex flex-col gap-2.25">
                    <p className="m-0 flex items-center gap-2.5 text-[13px] text-accent uppercase">
                        <span aria-hidden="true" className="block h-0.5 w-6 bg-accent" />
                        Your next story is out there
                    </p>
                    <h1 className="m-0 font-serif text-[44px] leading-[1.1] font-normal text-ink">Discover</h1>
                    <p className="m-0 text-base text-ink-soft">Picked from what you already love, and what people are into right now.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link to="/search" className="flex h-9.5 items-center gap-2 rounded-md border border-line bg-surface-raised px-3.5 text-[15px] font-semibold text-ink hover:border-accent">
                        <Icon src="/navbar-icons/search-icon.svg" box="size-4" />
                        Search instead
                    </Link>
                    <button type="button" disabled={refreshing || !data} onClick={() => void refresh()} className="flex h-9.5 cursor-pointer items-center gap-2 rounded-md border border-line bg-surface-raised px-3.5 text-[15px] font-semibold text-ink hover:border-accent disabled:opacity-50">
                        {refreshing ? "Refreshing…" : "Refresh suggestions"}
                    </button>
                </div>
            </section>

            {kinds.length > 1 && (
                <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-1 border-b border-line pb-4">
                    <button type="button" aria-pressed={kind === "all"} onClick={() => setKind("all")} className={CHIP}>Everything</button>
                    {kinds.map((k) => (
                        <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={CHIP}>
                            {{ anime: "Anime", tv: "TV", movie: "Films", book: "Books", "light-novel": "Light novels", manga: "Manga", audiobook: "Audiobooks", game: "Games" }[k] ?? k}
                        </button>
                    ))}
                </div>
            )}

            {data === null && !failed && <p role="status" className="m-0 text-base text-ink-muted">Asking your sources for ideas… this can take a few seconds the first time.</p>}
            {failed && <p role="alert" className="m-0 text-base text-ink">Couldn’t load suggestions. Check that the server is running.</p>}
            {data && shelves.length === 0 && (
                <p className="m-0 text-base text-ink-muted">
                    No suggestions yet. Add a few titles linked to AniList, TMDb or Open Library, and ideas will appear here.
                </p>
            )}

            {shelves.map((shelf) => (
                <section key={shelf.id} className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <h2 className="m-0 font-serif text-3xl font-normal text-ink">{shelf.title}</h2>
                            <p className="m-0 text-[15px] text-ink-muted">{shelf.subtitle}</p>
                        </div>
                        {shelf.seedId && (
                            <Link to={`/library/${shelf.seedId}`} className="flex items-center gap-2 text-[14px] text-accent hover:opacity-80">
                                Open the title
                                <Icon src="/featured/arrow-up-right.svg" box="size-3.25" />
                            </Link>
                        )}
                    </div>
                    <ul className="m-0 grid list-none grid-cols-2 gap-5 p-0 md:grid-cols-3 lg:grid-cols-5">
                        {shelf.items.map(({ hit, mediaId }) => {
                            const key = `${hit.provider}:${hit.externalId}`
                            return (
                                <li key={key}>
                                    <DiscoverCard hit={hit} mediaId={added[key] ?? mediaId} adding={adding === key} onAdd={() => void add(hit)} />
                                </li>
                            )
                        })}
                    </ul>
                </section>
            ))}

            {problems.length > 0 && (
                <p className="m-0 text-[14px] text-ink-muted">
                    Some sources didn’t answer: {problems.map(([p, m]) => `${PROVIDER_NAMES[p as Provider] ?? p} (${m})`).join(", ")}.
                </p>
            )}
        </main>
    )
}
