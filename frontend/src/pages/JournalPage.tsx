import {type FormEvent, useEffect, useMemo, useRef, useState} from "react";
import {Link, useSearchParams} from "react-router-dom";
import {api} from "../api.ts";
import Icon from "../components/Icon.tsx";
import NoteDialog, {type NoteDraft} from "../components/NoteDialog.tsx";
import {loadLibrary, typeOf, type MediaSummary} from "../components/library/media.ts";
import {KIND_TO_TYPE, NO_COVER} from "../components/mediapage/titleApi.ts";

// RecentEntry.java and RecentReview.java
type Note = { id: number, mediaId: number, mediaTitle: string, mediaKind: string, mediaCover: string | null, episodeId: number | null, episodeNumber: number | null, quote: string, reflection: string | null, writtenOn: string }
type Review = { id: number, mediaId: number, mediaTitle: string, mediaKind: string, mediaCover: string | null, headline: string | null, body: string, rating: number | null, spoilers: boolean, writtenOn: string }
type Entry = ({ type: "note" } & Note) | ({ type: "review" } & Review)

const TAB = "flex h-full items-center gap-2 border-b-2 text-[15px] whitespace-nowrap transition-colors"
const monthOf = (iso: string) => new Date(`${iso}T00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })
const dayOf = (iso: string) => new Date(`${iso}T00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })

export default function JournalPage() {
    const [params, setParams] = useSearchParams()
    const tab = params.get("tab") ?? "all"
    const mediaFilter = params.get("media") ? Number(params.get("media")) : null
    const [notes, setNotes] = useState<Note[] | null>(null)
    const [reviews, setReviews] = useState<Review[] | null>(null)
    const [library, setLibrary] = useState<MediaSummary[]>([])
    const [query, setQuery] = useState("")
    const [writing, setWriting] = useState<{ note: Note | null, mediaId: number | null } | null>(null)
    const [choosing, setChoosing] = useState(false)

    function load() {
        void api.get<Note[]>("/journal/recent", { params: { limit: 1000 } }).then((r) => setNotes(r.data)).catch(() => setNotes([]))
        void api.get<Review[]>("/reviews/recent", { params: { limit: 1000 } }).then((r) => setReviews(r.data)).catch(() => setReviews([]))
    }
    useEffect(() => {
        load()
        void loadLibrary().then(setLibrary).catch(() => {})
    }, [])

    function setParam(key: string, value: string | null) {
        const next = new URLSearchParams(params)
        if (value === null || value === "all") next.delete(key)
        else next.set(key, value)
        setParams(next)
    }

    const entries = useMemo(() => {
        const all: Entry[] = [
            ...(notes ?? []).map((n) => ({ type: "note" as const, ...n })),
            ...(reviews ?? []).map((r) => ({ type: "review" as const, ...r })),
        ]
        const q = query.trim().toLowerCase()
        return all
            .filter((e) => tab === "all" || (tab === "notes" ? e.type === "note" : e.type === "review"))
            .filter((e) => mediaFilter === null || e.mediaId === mediaFilter)
            .filter((e) => !q || `${e.mediaTitle} ${e.type === "note" ? `${e.quote} ${e.reflection ?? ""}` : `${e.headline ?? ""} ${e.body}`}`.toLowerCase().includes(q))
            .sort((a, b) => b.writtenOn.localeCompare(a.writtenOn) || b.id - a.id)
    }, [notes, reviews, tab, mediaFilter, query])

    // Grouped by month, newest first
    const months = entries.reduce<{ month: string, items: Entry[] }[]>((groups, e) => {
        const month = monthOf(e.writtenOn)
        const last = groups[groups.length - 1]
        if (last?.month === month) last.items.push(e)
        else groups.push({ month, items: [e] })
        return groups
    }, [])

    const titlesWritten = [...new Map([...(notes ?? []), ...(reviews ?? [])].map((e) => [e.mediaId, e.mediaTitle])).entries()]
    const filteredTitle = mediaFilter !== null ? titlesWritten.find(([id]) => id === mediaFilter)?.[1] : null
    const loading = notes === null || reviews === null

    async function saveNote(draft: NoteDraft) {
        const target = writing
        if (!target) return
        const body = { quote: draft.quote, reflection: draft.reflection || null }
        if (target.note) await api.put(`/journal/${target.note.id}`, { ...body, episodeId: target.note.episodeId, writtenOn: target.note.writtenOn })
        else if (target.mediaId) await api.post(`/media/${target.mediaId}/journal`, body)
        load()
    }

    return (
        <main className="flex flex-col pb-16">
            <section className="flex flex-wrap items-center justify-between gap-6 pt-9 pb-7.5">
                <div className="flex flex-col gap-2.25">
                    <p className="m-0 flex items-center gap-2.5 text-[13px] text-accent uppercase">
                        <span aria-hidden="true" className="block h-0.5 w-6 bg-accent" />
                        What stays with you
                    </p>
                    <h1 className="m-0 font-serif text-[44px] leading-[1.1] font-normal text-ink">Journal</h1>
                    <p className="m-0 text-base text-ink-soft">Every note and review you’ve written, in one quiet place.</p>
                </div>
                <button type="button" onClick={() => setChoosing(true)} className="flex h-9.5 cursor-pointer items-center gap-2 rounded-md border border-accent bg-accent px-3.5 text-[15px] font-semibold text-bg hover:opacity-90">
                    <Icon src="/pencil.svg" box="size-4" />
                    Write a note
                </button>
            </section>

            <div className="flex min-h-13.5 flex-wrap items-center gap-x-7.5 border-b border-line">
                <nav aria-label="Journal entries" className="flex h-13.5 gap-7.5">
                    {[
                        { id: "all", label: "Everything", count: (notes?.length ?? 0) + (reviews?.length ?? 0) },
                        { id: "notes", label: "Notes", count: notes?.length ?? 0 },
                        { id: "reviews", label: "Reviews", count: reviews?.length ?? 0 },
                    ].map((t) => (
                        <button key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => setParam("tab", t.id)}
                            className={`${TAB} cursor-pointer ${tab === t.id ? "border-accent font-semibold text-accent" : "border-transparent text-ink-soft hover:text-ink"}`}>
                            {t.label}
                            <span className={`text-[14px] font-normal ${tab === t.id ? "text-accent" : "text-ink-muted"}`}>{t.count}</span>
                        </button>
                    ))}
                </nav>
                <p className="m-0 ml-auto hidden items-center gap-1.75 text-[14px] text-ink-muted md:flex">
                    <Icon src="/space-icons/lock-keyhole.svg" box="size-3.25" />
                    Only you can see your journal
                </p>
            </div>

            <div className="grid gap-8 pt-7 lg:grid-cols-[minmax(0,1fr)_17rem]">
                <div className="flex min-w-0 flex-col gap-8">
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex h-10 min-w-48 flex-1 items-center gap-2.5 rounded-md border border-line bg-surface px-3.5 focus-within:border-accent">
                            <Icon src="/navbar-icons/search-icon.svg" box="size-4" className="text-ink-muted" />
                            <span className="sr-only">Search your journal</span>
                            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your notes and reviews" className="min-w-px flex-1 border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-muted" />
                        </label>
                        {filteredTitle && (
                            <p className="m-0 flex items-center gap-2 rounded-md bg-accent-soft px-3 py-1.5 text-[14px] text-accent">
                                {filteredTitle}
                                <button type="button" aria-label="Show every title" onClick={() => setParam("media", null)} className="flex cursor-pointer"><Icon src="/x.svg" box="size-3.5" /></button>
                            </p>
                        )}
                    </div>

                    {loading && <p role="status" className="m-0 text-base text-ink-muted">Opening your journal…</p>}
                    {!loading && entries.length === 0 && (
                        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-line p-6">
                            <p className="m-0 font-serif text-[24px] text-ink">{query || mediaFilter ? "Nothing matches." : "Your journal is empty, for now."}</p>
                            <p className="m-0 text-[15px] text-ink-muted">Write a note after an episode or a chapter, or a review when you finish something. They’ll gather here.</p>
                        </div>
                    )}

                    {months.map(({ month, items }) => (
                        <section key={month} className="flex flex-col gap-4">
                            <h2 className="m-0 text-[13px] font-semibold text-ink-muted uppercase">{month}</h2>
                            <ol className="m-0 flex list-none flex-col gap-4 p-0">
                                {items.map((e) => (
                                    <li key={`${e.type}-${e.id}`} className="flex gap-4 rounded-xl bg-surface p-5">
                                        <Link to={`/library/${e.mediaId}`} className="shrink-0" aria-label={e.mediaTitle}>
                                            <img src={e.mediaCover ?? NO_COVER} alt="" className="h-24 w-16 rounded-[3px] object-cover" />
                                        </Link>
                                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                                            <p className="m-0 flex flex-wrap items-center gap-x-2 text-[13px] text-ink-muted">
                                                <span className="text-accent uppercase">{e.type === "note" ? "Note" : "Review"}</span>
                                                · {dayOf(e.writtenOn)} ·
                                                <Link to={`/library/${e.mediaId}${e.type === "review" ? "#reviews" : ""}`} className="text-ink-soft hover:text-accent">{e.mediaTitle}</Link>
                                                <span>{KIND_TO_TYPE[e.mediaKind] ?? e.mediaKind}{e.type === "note" && e.episodeNumber ? ` · Episode ${e.episodeNumber}` : ""}</span>
                                            </p>
                                            {e.type === "note" ? (
                                                <>
                                                    <blockquote className="m-0 font-serif text-[24px] leading-[1.35] text-ink">“{e.quote}”</blockquote>
                                                    {e.reflection && <p className="m-0 text-[15px] leading-[1.7] whitespace-pre-line text-ink-soft">{e.reflection}</p>}
                                                    <button type="button" onClick={() => setWriting({ note: e, mediaId: e.mediaId })} className="flex cursor-pointer items-center gap-1.5 self-start text-[14px] text-ink-soft hover:text-accent">
                                                        <Icon src="/pencil.svg" box="size-3.5" />
                                                        Edit note
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                                                        {e.headline && <h3 className="m-0 font-serif text-[24px] leading-[1.25] font-normal text-ink">{e.headline}</h3>}
                                                        {e.rating !== null && <p className="m-0 text-[15px] text-accent">★ {e.rating.toFixed(1)} / 10</p>}
                                                    </div>
                                                    <p className={`m-0 line-clamp-4 text-[15px] leading-[1.7] whitespace-pre-line ${e.spoilers ? "text-ink-muted italic" : "text-ink-soft"}`}>
                                                        {e.spoilers ? "Contains spoilers. Open the title to read it." : e.body}
                                                    </p>
                                                    <Link to={`/library/${e.mediaId}#reviews`} className="self-start text-[14px] text-accent hover:opacity-80">Read and edit the review</Link>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    ))}
                </div>

                <aside className="flex flex-col gap-4">
                    <h2 className="m-0 text-[13px] font-normal text-ink-muted uppercase">Titles you’ve written about</h2>
                    {titlesWritten.length === 0 && !loading && <p className="m-0 text-[14px] text-ink-muted">None yet.</p>}
                    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                        {titlesWritten.map(([id, title]) => (
                            <li key={id}>
                                <button type="button" aria-pressed={mediaFilter === id} onClick={() => setParam("media", mediaFilter === id ? null : String(id))}
                                    className="flex w-full cursor-pointer items-center rounded-md px-2.75 py-2 text-left text-[15px] text-ink-soft transition-colors hover:bg-surface hover:text-ink aria-pressed:bg-accent-soft aria-pressed:text-accent">
                                    <span className="truncate">{title}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>

            <ChooseTitleDialog
                open={choosing}
                library={library}
                onClose={() => setChoosing(false)}
                onChosen={(mediaId) => { setChoosing(false); setWriting({ note: null, mediaId }) }}
            />
            <NoteDialog
                open={writing !== null}
                heading={writing?.note ? "Edit your note" : `A note on ${library.find((m) => m.id === writing?.mediaId)?.title ?? "this title"}`}
                initial={writing?.note ? { quote: writing.note.quote, reflection: writing.note.reflection ?? "" } : undefined}
                onClose={() => setWriting(null)}
                onSave={saveNote}
                onDelete={writing?.note ? async () => { await api.delete(`/journal/${writing.note!.id}`); load() } : undefined}
            />
        </main>
    )
}

// Notes belong to a title, so writing one from the Journal starts by picking which
function ChooseTitleDialog({ open, library, onClose, onChosen }: { open: boolean, library: MediaSummary[], onClose: () => void, onChosen: (id: number) => void }) {
    const ref = useRef<HTMLDialogElement>(null)
    const [mediaId, setMediaId] = useState("")
    useEffect(() => {
        const dialog = ref.current
        if (!dialog) return
        if (open && !dialog.open) { setMediaId(""); dialog.showModal() }
        else if (!open && dialog.open) dialog.close()
    }, [open])

    function submit(e: FormEvent) {
        e.preventDefault()
        if (mediaId) onChosen(Number(mediaId))
    }

    return (
        <dialog ref={ref} onClose={onClose} aria-labelledby="choose-title-heading" className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink [color-scheme:dark] backdrop:bg-black/70">
            <form onSubmit={submit} className="flex flex-col gap-4 p-6">
                <h2 id="choose-title-heading" className="m-0 font-serif text-[27px] font-normal">What’s it about?</h2>
                {library.length === 0 ? (
                    <p className="m-0 text-[15px] text-ink-muted">Add a title to your library first; notes belong to a title.</p>
                ) : (
                    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted">
                        Title
                        <select required value={mediaId} onChange={(e) => setMediaId(e.target.value)} className="rounded-md border border-line bg-bg px-3 py-2 text-[15px] text-ink focus:border-accent focus:outline-none">
                            <option value="" disabled>Choose a title</option>
                            {[...library].sort((a, b) => a.title.localeCompare(b.title)).map((m) => <option key={m.id} value={m.id}>{m.title} · {typeOf(m)}</option>)}
                        </select>
                    </label>
                )}
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="cursor-pointer rounded-md border border-line px-3 py-2 text-[14px] text-ink hover:border-accent">Cancel</button>
                    <button type="submit" disabled={!mediaId} className="cursor-pointer rounded-md border border-accent bg-accent px-4 py-2 text-[14px] font-semibold text-bg hover:opacity-90 disabled:opacity-50">Continue</button>
                </div>
            </form>
        </dialog>
    )
}
