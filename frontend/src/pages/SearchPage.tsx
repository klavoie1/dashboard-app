import {type FormEvent, useEffect, useMemo, useState} from "react";
import {Link, useNavigate, useSearchParams} from "react-router-dom";
import {api} from "../api.ts";
import Icon from "../components/Icon.tsx";
import {KIND_TO_TYPE, type RefreshResult} from "../components/mediapage/titleApi.ts";
import {PROVIDER_LOGOS, PROVIDER_NAMES, type Provider} from "../components/mediapage/titles.ts";
import {coverOf, loadLibrary, proxied, statusLabel, typeOf, type MediaSummary} from "../components/library/media.ts";

type Hit = { provider: Provider, externalId: string, kind: string, title: string, year: number | null, detail: string | null, imageUrl: string | null }
type SearchResponse = { results: { hit: Hit, mediaId: number | null }[], problems: Record<string, string> }

const CHIP = "flex cursor-pointer items-center gap-1.5 rounded-md px-3.25 py-2 text-[14px] text-ink-soft transition-colors hover:text-ink aria-pressed:bg-accent-soft aria-pressed:text-accent"

export default function SearchPage() {
    const [params, setParams] = useSearchParams()
    const query = params.get("q")?.trim() ?? ""
    const navigate = useNavigate()
    const [draft, setDraft] = useState(query)
    const [library, setLibrary] = useState<MediaSummary[]>([])
    const [found, setFound] = useState<{ query: string, data: SearchResponse | null, failed: boolean } | null>(null)
    const [kind, setKind] = useState("all")
    const [adding, setAdding] = useState<string | null>(null)
    const [addError, setAddError] = useState<string | null>(null)

    useEffect(() => { void loadLibrary().then(setLibrary).catch(() => {}) }, [])

    // A new search replaces the results; an older answer arriving late is ignored
    useEffect(() => {
        if (!query) return
        let current = true
        api.get<SearchResponse>("/media/search", { params: { q: query } })
            .then((r) => current && setFound({ query, data: r.data, failed: false }))
            .catch(() => current && setFound({ query, data: null, failed: true }))
        return () => { current = false }
    }, [query])

    const loading = query !== "" && found?.query !== query
    const results = found?.query === query ? found.data?.results ?? [] : []
    const kinds = [...new Set(results.map((r) => r.hit.kind))]
    const visible = kind === "all" ? results : results.filter((r) => r.hit.kind === kind)

    const inLibrary = useMemo(() => {
        const q = query.toLowerCase()
        return q ? library.filter((m) => `${m.title} ${m.subtitle ?? ""} ${m.creator ?? ""}`.toLowerCase().includes(q)) : []
    }, [library, query])

    function submit(e: FormEvent) {
        e.preventDefault()
        setKind("all")
        setParams(draft.trim() ? { q: draft.trim() } : {})
    }

    async function add(hit: Hit) {
        const key = `${hit.provider}-${hit.externalId}`
        setAdding(key)
        setAddError(null)
        try {
            const { data } = await api.post<RefreshResult>("/media/import", {
                provider: hit.provider, externalId: hit.externalId, kind: hit.kind, title: hit.title,
            })
            navigate(`/library/${data.media.id}`)
        } catch {
            setAddError(`Couldn’t add ${hit.title}. Try again.`)
            setAdding(null)
        }
    }

    const problems = found?.query === query ? Object.entries(found.data?.problems ?? {}) : []

    return (
        <main className="flex flex-col gap-8 py-10">
            <div className="flex flex-col gap-2">
                <p className="m-0 flex items-center gap-2.25 text-[13px] text-accent uppercase">
                    <span aria-hidden="true" className="block h-0.5 w-6 bg-accent" />
                    Add to your library
                </p>
                <h1 className="m-0 font-serif text-5xl font-normal text-ink">Find your next story</h1>
                <p className="m-0 text-base text-ink-soft">Searches your library and every source you’ve set up, all at once.</p>
            </div>

            <form role="search" onSubmit={submit} className="flex max-w-2xl gap-3">
                <label className="flex h-11 flex-1 items-center gap-2.5 rounded-md border border-line bg-surface px-3.5 focus-within:border-accent">
                    <Icon src="/navbar-icons/search-icon.svg" box="size-4" className="text-ink-muted" />
                    <span className="sr-only">Search titles</span>
                    <input
                        type="search"
                        autoFocus={!query}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="A title, author or studio"
                        className="min-w-px flex-1 border-0 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted"
                    />
                </label>
                <button type="submit" className="cursor-pointer rounded-md border border-accent bg-accent px-4 text-[15px] font-semibold text-bg hover:opacity-90">Search</button>
            </form>

            {inLibrary.length > 0 && (
                <section className="flex flex-col gap-4">
                    <h2 className="m-0 text-[13px] font-semibold text-ink-muted uppercase">Already in your library</h2>
                    <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
                        {inLibrary.slice(0, 8).map((m) => (
                            <li key={m.id}>
                                <Link to={`/library/${m.id}`} className="flex items-center gap-3 rounded-md bg-surface p-2.5 pr-4 transition-colors hover:bg-surface-raised">
                                    <img src={coverOf(m)} alt="" className="h-14 w-10 rounded-[3px] object-cover" />
                                    <span className="flex flex-col gap-1">
                                        <span className="text-[15px] font-semibold text-ink">{m.title}</span>
                                        <span className="text-[13px] text-ink-muted">{typeOf(m)} · {statusLabel(m)}</span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {query && (
                <section className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="m-0 font-serif text-3xl font-normal text-ink">From your sources</h2>
                        {kinds.length > 1 && (
                            <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-1">
                                <button type="button" aria-pressed={kind === "all"} onClick={() => setKind("all")} className={CHIP}>All {results.length}</button>
                                {kinds.map((k) => (
                                    <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={CHIP}>
                                        {KIND_TO_TYPE[k] ?? k} {results.filter((r) => r.hit.kind === k).length}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {loading && <p role="status" className="m-0 text-base text-ink-muted">Searching…</p>}
                    {found?.failed && found.query === query && <p role="alert" className="m-0 text-base text-ink">Search failed. Check that the server is running.</p>}
                    {!loading && found?.data && visible.length === 0 && (
                        <p className="m-0 text-base text-ink-muted">Nothing found for “{query}”.</p>
                    )}
                    {addError && <p role="alert" className="m-0 text-base text-ink">{addError}</p>}

                    <ul className="m-0 grid list-none grid-cols-2 gap-5 p-0 sm:grid-cols-3 lg:grid-cols-5">
                        {visible.map(({ hit, mediaId }) => {
                            const key = `${hit.provider}-${hit.externalId}`
                            return (
                                <li key={key} className="flex flex-col gap-3">
                                    <div className="relative">
                                        <img src={proxied(hit.imageUrl)} alt="" loading="lazy" className="aspect-2/3 w-full rounded-md bg-surface object-cover" />
                                        {PROVIDER_LOGOS[hit.provider] && (
                                            <img src={PROVIDER_LOGOS[hit.provider]} alt={`From ${PROVIDER_NAMES[hit.provider]}`} className="absolute top-2.5 left-2.5 size-5 rounded-sm" />
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col gap-1.5">
                                        <p className="m-0 text-[12px] text-accent uppercase">{KIND_TO_TYPE[hit.kind] ?? hit.kind}</p>
                                        <p className="m-0 text-base leading-[1.35] font-medium text-ink">{hit.title}</p>
                                        <p className="m-0 text-[13px] text-ink-muted">{[hit.detail, hit.year].filter(Boolean).join(" · ")}</p>
                                    </div>
                                    {mediaId ? (
                                        <Link to={`/library/${mediaId}`} className="flex items-center gap-1.5 text-[14px] text-accent hover:opacity-80">
                                            <Icon src="/featured/check.svg" box="size-3.5" />
                                            In your library
                                        </Link>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={adding !== null}
                                            onClick={() => add(hit)}
                                            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-line py-2 text-[14px] font-medium text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-default disabled:opacity-50"
                                        >
                                            <Icon src="/plus.svg" box="size-3.5" />
                                            {adding === key ? "Adding…" : "Add to library"}
                                        </button>
                                    )}
                                </li>
                            )
                        })}
                    </ul>

                    {problems.length > 0 && (
                        <div className="flex flex-col gap-1.5 rounded-md border border-line p-4 text-[14px] text-ink-soft">
                            <p className="m-0 text-ink">Some sources weren’t searched</p>
                            {problems.map(([p, msg]) => (
                                <p key={p} className="m-0">{PROVIDER_NAMES[p as Provider] ?? p}: {msg}</p>
                            ))}
                            <Link to="/settings" className="self-start text-accent hover:opacity-80">Open settings</Link>
                        </div>
                    )}
                </section>
            )}
        </main>
    )
}
