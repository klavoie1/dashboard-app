import {type FormEvent, useEffect, useRef, useState} from "react";
import {api} from "../../api.ts";
import Icon from "../Icon.tsx";

// ReviewResponse.java
export type Review = {
    id: number
    headline: string | null
    body: string
    rating: number | null
    spoilers: boolean
    writtenOn: string
    updatedAt: string
}

// Reviews longer than this start folded, with "Read the whole review"
const FOLD_AT = 600

const longDate = (iso: string) => new Date(`${iso}T00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

// Your own written reviews of a title. onRated lets the page offer the review's score as your rating.
export default function ReviewSection({ mediaId, title, prompt, onRated }: {
    mediaId: number
    title: string
    // e.g. "What did this book leave you with?"
    prompt: string
    onRated?: (rating: number) => Promise<void>
}) {
    const [reviews, setReviews] = useState<Review[] | null>(null)
    const [editing, setEditing] = useState<Review | "new" | null>(null)

    useEffect(() => {
        void api.get<Review[]>(`/media/${mediaId}/reviews`).then((r) => setReviews(r.data)).catch(() => setReviews([]))
    }, [mediaId])

    return (
        <section id="reviews" className="flex flex-col gap-4.5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="m-0 font-serif text-3xl font-normal text-ink">Your review</h2>
                <button type="button" onClick={() => setEditing("new")} className="flex cursor-pointer items-center gap-2 rounded-md border border-line bg-surface-raised px-3.25 py-2.25 text-[15px] font-semibold text-ink hover:border-accent">
                    <Icon src="/pencil.svg" box="size-4" />
                    {reviews?.length ? "Write another review" : "Write a review"}
                </button>
            </div>

            {reviews !== null && reviews.length === 0 && (
                <button type="button" onClick={() => setEditing("new")} className="cursor-pointer rounded-xl border border-dashed border-line p-6 text-left transition-colors hover:border-accent">
                    <p className="m-0 font-serif text-[24px] text-ink">{prompt}</p>
                    <p className="m-0 mt-2 text-[15px] text-ink-muted">Write as much or as little as you like. Reviews stay private on your server.</p>
                </button>
            )}

            {reviews?.map((r) => <ReviewCard key={r.id} review={r} onEdit={() => setEditing(r)} />)}

            <ReviewDialog
                mediaId={mediaId}
                title={title}
                review={editing}
                onClose={() => setEditing(null)}
                onSaved={async (saved, useRating) => {
                    setReviews((list) => {
                        const rest = (list ?? []).filter((x) => x.id !== saved.id)
                        return [saved, ...rest].sort((a, b) => b.writtenOn.localeCompare(a.writtenOn) || b.id - a.id)
                    })
                    if (useRating && saved.rating && onRated) await onRated(saved.rating)
                }}
                onDeleted={(id) => setReviews((list) => list?.filter((x) => x.id !== id) ?? null)}
            />
        </section>
    )
}

function ReviewCard({ review: r, onEdit }: { review: Review, onEdit: () => void }) {
    const [open, setOpen] = useState(r.body.length <= FOLD_AT)
    const [revealed, setRevealed] = useState(!r.spoilers)
    return (
        <article className="flex flex-col gap-4 rounded-xl bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 flex items-center gap-1.75 text-[13px] font-semibold text-ink-muted uppercase">
                    <Icon src="/space-icons/lock-keyhole.svg" box="size-3.25" />
                    {longDate(r.writtenOn)} · Only you
                </p>
                {r.rating !== null && (
                    <p className="m-0 flex items-baseline gap-1.5 text-ink">
                        <Icon src="/icons/star.svg" box="size-4 self-center" className="text-accent" />
                        <span className="text-xl text-accent">{r.rating.toFixed(1)}</span>
                        <span className="text-[14px] text-ink-muted">/ 10</span>
                    </p>
                )}
            </div>
            {r.headline && <h3 className="m-0 font-serif text-[27px] leading-[1.2] font-normal text-ink">{r.headline}</h3>}
            {revealed ? (
                <>
                    <p className={`m-0 text-base leading-[1.8] whitespace-pre-line text-ink-soft ${open ? "" : "line-clamp-6"}`}>{r.body}</p>
                    {r.body.length > FOLD_AT && (
                        <button type="button" onClick={() => setOpen((v) => !v)} className="cursor-pointer self-start text-[14px] text-accent hover:opacity-80">
                            {open ? "Show less" : "Read the whole review"}
                        </button>
                    )}
                </>
            ) : (
                <button type="button" onClick={() => setRevealed(true)} className="flex cursor-pointer items-center gap-2.5 rounded-md border border-line bg-bg p-4 text-left text-[15px] text-ink-soft">
                    <Icon src="/episode-icons/eye-off.svg" box="size-4" />
                    <span className="flex-1">This review has spoilers</span>
                    <span className="text-[14px] font-semibold text-accent">Show it</span>
                </button>
            )}
            <hr className="m-0 h-px border-0 bg-line" />
            <div className="flex items-center justify-between gap-3">
                <p className="m-0 text-[13px] text-ink-muted">{r.body.trim().split(/\s+/).length} words{r.spoilers ? " · Contains spoilers" : ""}</p>
                <button type="button" onClick={onEdit} className="flex cursor-pointer items-center gap-2 text-[14px] text-ink-soft hover:text-accent">
                    <Icon src="/pencil.svg" box="size-3.5" />
                    Edit review
                </button>
            </div>
        </article>
    )
}

function ReviewDialog({ mediaId, title, review, onClose, onSaved, onDeleted }: {
    mediaId: number
    title: string
    review: Review | "new" | null
    onClose: () => void
    onSaved: (r: Review, useRating: boolean) => Promise<void>
    onDeleted: (id: number) => void
}) {
    const ref = useRef<HTMLDialogElement>(null)
    const [headline, setHeadline] = useState("")
    const [body, setBody] = useState("")
    const [rated, setRated] = useState(false)
    const [rating, setRating] = useState(8)
    const [spoilers, setSpoilers] = useState(false)
    const [useRating, setUseRating] = useState(true)
    const [writtenOn, setWrittenOn] = useState("")
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const existing = review !== "new" ? review : null

    useEffect(() => {
        const dialog = ref.current
        if (!dialog) return
        if (review && !dialog.open) {
            setHeadline(existing?.headline ?? "")
            setBody(existing?.body ?? "")
            setRated(existing?.rating != null)
            setRating(existing?.rating ?? 8)
            setSpoilers(existing?.spoilers ?? false)
            setWrittenOn(existing?.writtenOn ?? new Date().toISOString().slice(0, 10))
            setUseRating(true)
            setError(null)
            setConfirmDelete(false)
            dialog.showModal()
        } else if (!review && dialog.open) {
            dialog.close()
        }
    }, [review, existing])

    async function save(e: FormEvent) {
        e.preventDefault()
        setBusy(true)
        setError(null)
        try {
            const payload = { headline, body, rating: rated ? rating : null, spoilers, writtenOn }
            const { data } = existing
                ? await api.put<Review>(`/reviews/${existing.id}`, payload)
                : await api.post<Review>(`/media/${mediaId}/reviews`, payload)
            await onSaved(data, rated && useRating)
            onClose()
        } catch {
            setError("Couldn’t save your review. Try again.")
        } finally {
            setBusy(false)
        }
    }

    async function remove() {
        if (!existing) return
        if (!confirmDelete) return setConfirmDelete(true)
        setBusy(true)
        try {
            await api.delete(`/reviews/${existing.id}`)
            onDeleted(existing.id)
            onClose()
        } catch {
            setError("Couldn’t delete this review.")
        } finally {
            setBusy(false)
        }
    }

    const words = body.trim() ? body.trim().split(/\s+/).length : 0
    const field = "w-full rounded-md border border-line bg-bg px-3 py-2 text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
    return (
        <dialog ref={ref} onClose={onClose} aria-labelledby="review-heading" className="m-auto max-h-[92vh] w-[min(46rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface p-0 text-ink [color-scheme:dark] backdrop:bg-black/70">
            <form onSubmit={save} className="flex max-h-[92vh] flex-col">
                <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
                    <div className="flex flex-col gap-1">
                        <h2 id="review-heading" className="m-0 font-serif text-[27px] font-normal">{existing ? "Edit your review" : "Review"} {title}</h2>
                        <p className="m-0 flex items-center gap-1.5 text-[13px] text-ink-muted">
                            <Icon src="/space-icons/lock-keyhole.svg" box="size-3" />
                            Only you can see this. It stays on your server.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink">
                        <Icon src="/x.svg" box="size-4.5" />
                    </button>
                </header>
                <div className="flex flex-col gap-5 overflow-y-auto px-6 py-6 [scrollbar-color:var(--color-line)_transparent]">
                    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted">
                        Headline (optional)
                        <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="The little things are the whole point." className={`${field} font-serif text-[20px]`} />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted">
                        <span className="flex justify-between">Your review <span className="font-normal">{words} {words === 1 ? "word" : "words"}</span></span>
                        <textarea required rows={12} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What stayed with you? What didn’t work? Who would you give it to?" className={`${field} resize-y text-base leading-[1.75]`} />
                    </label>
                    <div className="flex flex-col gap-3 rounded-md border border-line p-4">
                        <label className="flex cursor-pointer items-center gap-2.5 text-[15px] text-ink">
                            <input type="checkbox" checked={rated} onChange={(e) => setRated(e.target.checked)} className="size-4 accent-accent" />
                            Give this review a score
                        </label>
                        {rated && (
                            <>
                                <div className="flex items-center gap-4">
                                    <input type="range" min={1} max={10} step={0.5} value={rating} onChange={(e) => setRating(Number(e.target.value))} aria-label="Score out of 10" className="flex-1 accent-accent" />
                                    <p className="m-0 w-20 text-right font-serif text-[28px] text-ink">{rating.toFixed(1)}</p>
                                </div>
                                <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ink-soft">
                                    <input type="checkbox" checked={useRating} onChange={(e) => setUseRating(e.target.checked)} className="size-4 accent-accent" />
                                    Also make it my rating for this title
                                </label>
                            </>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                        <label className="flex cursor-pointer items-center gap-2.5 text-[15px] text-ink">
                            <input type="checkbox" checked={spoilers} onChange={(e) => setSpoilers(e.target.checked)} className="size-4 accent-accent" />
                            Contains spoilers (hidden until you choose to show it)
                        </label>
                        <label className="flex items-center gap-2 text-[14px] text-ink-muted">
                            Written on
                            <input type="date" value={writtenOn} onChange={(e) => setWrittenOn(e.target.value)} className="rounded-md border border-line bg-bg px-2 py-1.5 text-ink focus:border-accent focus:outline-none" />
                        </label>
                    </div>
                </div>
                <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-6 py-4">
                    {existing && (
                        <button type="button" disabled={busy} onClick={() => void remove()} className={`mr-auto cursor-pointer text-[14px] ${confirmDelete ? "font-semibold text-ink" : "text-ink-muted hover:text-ink"}`}>
                            {confirmDelete ? "Delete it for good" : "Delete review"}
                        </button>
                    )}
                    {error && <p role="alert" className="m-0 text-[14px] text-ink">{error}</p>}
                    <button type="button" onClick={onClose} className="cursor-pointer rounded-md border border-line px-3 py-2 text-[14px] text-ink hover:border-accent">Cancel</button>
                    <button type="submit" disabled={busy} className="cursor-pointer rounded-md border border-accent bg-accent px-4 py-2 text-[14px] font-semibold text-bg hover:opacity-90 disabled:opacity-50">
                        {busy ? "Saving…" : "Save review"}
                    </button>
                </footer>
            </form>
        </dialog>
    )
}
