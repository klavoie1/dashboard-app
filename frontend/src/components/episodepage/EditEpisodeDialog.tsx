import {type FormEvent, type ReactNode, useEffect, useRef, useState} from "react";
import {api} from "../../api.ts";
import Icon from "../Icon.tsx";
import ImageChoices, {type ImageOption} from "../ImageChoices.tsx";
import {PROVIDER_NAMES, type EpisodeInfo, type EpisodeRef, type Provider} from "../mediapage/titles.ts";
import type {Suggestion} from "../mediapage/titleApi.ts";

const INPUT = "w-full rounded-md border border-line bg-bg px-3 py-2 text-[15px] text-ink [color-scheme:dark] placeholder:text-ink-muted focus:border-accent focus:outline-none"
const LABEL = "flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted"
const GHOST_BUTTON = "flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-[14px] text-ink transition-colors hover:border-accent hover:text-accent"

const FIELD_LABELS: Record<string, string> = { title: "Title", airDate: "Air date", minutes: "Length", summary: "Summary" }

type Draft = { title: string, headline: string, summary: string, recap: string, airDate: string, minutes: string, lockedFields: string[] }

function Field({ label, children, lock }: { label: string, children: ReactNode, lock?: { locked: boolean, toggle: () => void } }) {
    return (
        <div className="relative">
            <label className={LABEL}>{label}{children}</label>
            {lock && (
                <button
                    type="button"
                    aria-pressed={lock.locked}
                    aria-label={`${lock.locked ? "Unlock" : "Lock"} ${label.toLowerCase()}`}
                    title={lock.locked ? "Locked: fetching won’t change this" : "Lock so fetching won’t change this"}
                    onClick={lock.toggle}
                    className={`absolute -top-0.5 right-0 flex cursor-pointer items-center gap-1 text-[12px] ${lock.locked ? "text-accent" : "text-ink-muted opacity-60 hover:opacity-100"}`}
                >
                    <Icon src="/space-icons/lock-keyhole.svg" box="size-3" />
                    {lock.locked ? "Locked" : ""}
                </button>
            )}
        </div>
    )
}

// Editing one episode: its text, fetching details and stills from the sources, and its screenshots
export default function EditEpisodeDialog({ mediaId, ep, info, open, onClose, onChanged }: {
    mediaId: number
    ep: EpisodeRef
    info: EpisodeInfo
    open: boolean
    onClose: () => void
    // Something was saved; the page reloads the episode
    onChanged: () => Promise<void>
}) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const base = `/media/${mediaId}/episodes/${ep.overall}`
    const initial = (): Draft => ({
        title: ep.title.startsWith("Episode ") ? "" : ep.title, headline: info.headline ?? "", summary: info.summary ?? "",
        recap: info.recap ?? "", airDate: ep.aired ?? "", minutes: ep.minutes ? String(ep.minutes) : "", lockedFields: info.lockedFields ?? [],
    })
    const [draft, setDraft] = useState<Draft>(initial)
    const [busy, setBusy] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [stills, setStills] = useState<ImageOption[] | null>(null)
    const [problems, setProblems] = useState<Record<string, string> | null>(null)
    const [caption, setCaption] = useState("")

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (open && !dialog.open) {
            setDraft(initial())
            setError(null)
            setSuggestions([])
            setStills(null)
            setProblems(null)
            setCaption("")
            dialog.showModal()
        } else if (!open && dialog.open) {
            dialog.close()
        }
        // initial() reads the props this effect already depends on
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, ep, info])

    const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))
    const locked = (f: string) => draft.lockedFields.includes(f)
    const lock = (f: string) => ({
        locked: locked(f),
        toggle: () => {
            set("lockedFields", locked(f) ? draft.lockedFields.filter((x) => x !== f) : [...draft.lockedFields, f])
            setSuggestions((l) => l.filter((s) => s.field !== f))
        },
    })

    async function run<T>(label: string, action: () => Promise<T>, failure: string) {
        setBusy(label)
        setError(null)
        try {
            return await action()
        } catch {
            setError(failure)
            return undefined
        } finally {
            setBusy(null)
        }
    }

    async function fetchNow() {
        await run("fetching", async () => {
            const { data } = await api.post<{ suggestions: Suggestion[], stills: ImageOption[], problems: Record<string, string> }>(`${base}/suggest`)
            setSuggestions(data.suggestions)
            setStills(data.stills)
            setProblems(data.problems)
            // The community score updates on the server straight away
            await onChanged()
        }, "Couldn’t reach the server to fetch.")
    }

    function accept(s: Suggestion) {
        if (s.field === "title") set("title", String(s.value))
        if (s.field === "airDate") set("airDate", String(s.value))
        if (s.field === "minutes") set("minutes", String(s.value))
        if (s.field === "summary") set("summary", String(s.value))
        setSuggestions((l) => l.filter((x) => x !== s))
    }

    async function addStill(o: ImageOption) {
        const done = await run("image", () => api.post(`${base}/images/from-url`, { url: o.url, caption: caption || null }), "Couldn’t download that still.")
        if (done) {
            setStills((list) => list?.filter((x) => x.url !== o.url) ?? null)
            setCaption("")
            await onChanged()
        }
    }

    async function upload(file: File | undefined) {
        if (!file) return
        const form = new FormData()
        form.append("file", file)
        if (caption) form.append("caption", caption)
        const done = await run("image", () => api.post(`${base}/images`, form), "Couldn’t upload that image. Use a JPG, PNG, WebP or GIF under 15 MB.")
        if (done) {
            setCaption("")
            await onChanged()
        }
    }

    async function removeShot(id: number) {
        const done = await run("image", () => api.delete(`${base}/images/${id}`), "Couldn’t remove that screenshot.")
        if (done) await onChanged()
    }

    async function save(e: FormEvent) {
        e.preventDefault()
        const done = await run("saving", () => api.put(base, {
            title: draft.title, headline: draft.headline, summary: draft.summary, recap: draft.recap,
            airDate: draft.airDate || null, minutes: draft.minutes ? Number(draft.minutes) : null, lockedFields: draft.lockedFields,
        }), "Couldn’t save. Check the fields and try again.")
        if (done) {
            await onChanged()
            onClose()
        }
    }

    const shots = info.screenshots ?? []

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            aria-labelledby="edit-episode-heading"
            className="m-auto max-h-[90vh] w-[min(46rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface p-0 text-ink [color-scheme:dark] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
        >
            <form onSubmit={save} className="flex max-h-[90vh] flex-col">
                <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
                    <div className="flex flex-col gap-1">
                        <h2 id="edit-episode-heading" className="m-0 font-serif text-[27px] font-normal">Edit episode {ep.season ? `S${ep.season} · ` : ""}{String(ep.number).padStart(2, "0")}</h2>
                        <p className="m-0 text-[14px] text-ink-muted">Fetching asks this title’s linked sources about just this episode.</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink">
                        <Icon src="/x.svg" box="size-4.5" />
                    </button>
                </header>

                <div className="flex flex-col gap-6 overflow-y-auto px-6 py-6 [scrollbar-color:var(--color-line)_transparent]">
                    <div className="flex flex-col gap-3">
                        <button type="button" onClick={() => void fetchNow()} disabled={busy !== null} className={`${GHOST_BUTTON} self-start disabled:opacity-50`}>
                            {busy === "fetching" ? "Fetching…" : "Fetch episode details"}
                        </button>
                        {problems && Object.keys(problems).length > 0 && (
                            <ul role="status" className="m-0 flex list-none flex-col gap-1 p-0 text-[14px] text-ink-soft">
                                {Object.entries(problems).map(([p, m]) => <li key={p}><span className="text-ink">{PROVIDER_NAMES[p as Provider] ?? "Sources"}:</span> {m}</li>)}
                            </ul>
                        )}
                        {problems && Object.keys(problems).length === 0 && suggestions.length === 0 && (stills?.length ?? 0) === 0 && (
                            <p role="status" className="m-0 text-[14px] text-accent">Fetched. Nothing new for this episode.</p>
                        )}
                        {suggestions.length > 0 && (
                            <section aria-label="Suggestions" className="flex flex-col gap-2 rounded-md border border-accent/40 bg-accent-soft/40 p-4">
                                <div className="flex items-center justify-between">
                                    <p className="m-0 text-[15px] font-semibold text-ink">{suggestions.length} {suggestions.length === 1 ? "suggestion" : "suggestions"}</p>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => suggestions.forEach(accept)} className="cursor-pointer text-[14px] font-semibold text-accent hover:opacity-80">Use all</button>
                                        <button type="button" onClick={() => setSuggestions([])} className="cursor-pointer text-[14px] text-ink-soft hover:text-ink">Ignore all</button>
                                    </div>
                                </div>
                                {suggestions.map((s) => (
                                    <div key={s.field} className="flex flex-col gap-1.5 rounded-md bg-surface p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="m-0 text-[13px] font-semibold text-ink-muted uppercase">
                                                {FIELD_LABELS[s.field]} <span className="font-normal normal-case">from {PROVIDER_NAMES[s.provider]}</span>
                                            </p>
                                            <div className="flex gap-3">
                                                <button type="button" onClick={() => accept(s)} className="cursor-pointer text-[14px] font-semibold text-accent hover:opacity-80">Use</button>
                                                <button type="button" onClick={() => setSuggestions((l) => l.filter((x) => x !== s))} className="cursor-pointer text-[14px] text-ink-soft hover:text-ink">Ignore</button>
                                                <button type="button" onClick={() => lock(s.field).toggle()} className="cursor-pointer text-[14px] text-ink-soft hover:text-ink">Lock</button>
                                            </div>
                                        </div>
                                        <div className="grid gap-1 text-[14px] sm:grid-cols-2 sm:gap-3">
                                            <p className="m-0 line-clamp-3 text-ink-muted"><s>{s.current == null || s.current === "" ? "Empty" : String(s.current)}</s></p>
                                            <p className="m-0 line-clamp-3 text-ink">{String(s.value)}{s.field === "minutes" ? " min" : ""}</p>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}
                    </div>

                    <fieldset className="m-0 flex flex-col gap-4 border-0 border-t border-line p-0 pt-6">
                        <legend className="float-left mb-1 p-0 text-[13px] font-semibold text-ink-muted uppercase">Episode</legend>
                        <Field label="Title" lock={lock("title")}><input value={draft.title} onChange={(e) => set("title", e.target.value)} className={INPUT} /></Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Air date" lock={lock("airDate")}><input type="date" value={draft.airDate} onChange={(e) => set("airDate", e.target.value)} className={INPUT} /></Field>
                            <Field label="Length (minutes)" lock={lock("minutes")}><input type="number" min={1} value={draft.minutes} onChange={(e) => set("minutes", e.target.value)} className={INPUT} /></Field>
                        </div>
                        <Field label="Headline"><input value={draft.headline} placeholder="A short line shown above the summary" onChange={(e) => set("headline", e.target.value)} className={INPUT} /></Field>
                        <Field label="Spoiler-free summary" lock={lock("summary")}>
                            <textarea rows={4} value={draft.summary} onChange={(e) => set("summary", e.target.value)} className={`${INPUT} resize-y leading-relaxed`} />
                        </Field>
                        <Field label="Full recap (hidden behind a spoiler warning)">
                            <textarea rows={4} value={draft.recap} onChange={(e) => set("recap", e.target.value)} className={`${INPUT} resize-y leading-relaxed`} />
                        </Field>
                    </fieldset>

                    <fieldset className="m-0 flex flex-col gap-4 border-0 border-t border-line p-0 pt-6">
                        <legend className="float-left mb-1 p-0 text-[13px] font-semibold text-ink-muted uppercase">Screenshots</legend>
                        {shots.length > 0 ? (
                            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
                                {shots.map((s) => (
                                    <li key={s.src} className="flex flex-col gap-1.5">
                                        <img src={s.src} alt={s.caption} className="aspect-video w-full rounded object-cover" />
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate text-[13px] text-ink-soft">{s.caption || "No caption"}</span>
                                            {s.id !== undefined && (
                                                <button type="button" disabled={busy !== null} onClick={() => void removeShot(s.id!)} className="cursor-pointer text-[13px] text-ink-muted hover:text-ink">Remove</button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="m-0 text-[14px] text-ink-muted">No screenshots yet.</p>}
                        <label className={LABEL}>
                            Caption for the next screenshot (optional)
                            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. The weight of a hero" className={INPUT} />
                        </label>
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy !== null} onChange={(e) => void upload(e.target.files?.[0])} className="text-[14px] text-ink-soft file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-line file:bg-surface-raised file:px-3 file:py-2 file:text-ink" />
                        {busy === "image" && <p role="status" className="m-0 text-[13px] text-ink-muted">Saving screenshot…</p>}
                        {stills && stills.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <p className="m-0 text-[14px] text-ink-soft">Stills from your sources. Pick any to add them as screenshots.</p>
                                <ImageChoices options={stills} wide busy={busy !== null} onChoose={(o) => void addStill(o)} />
                            </div>
                        )}
                    </fieldset>
                </div>

                <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-6 py-4">
                    {error && <p role="alert" className="m-0 mr-auto text-[14px] text-ink">{error}</p>}
                    <button type="button" onClick={onClose} className={GHOST_BUTTON}>Close</button>
                    <button type="submit" disabled={busy !== null} className="cursor-pointer rounded-md border border-accent bg-accent px-4 py-2 text-[14px] font-semibold text-bg hover:opacity-90 disabled:opacity-50">
                        {busy === "saving" ? "Saving…" : "Save episode"}
                    </button>
                </footer>
            </form>
        </dialog>
    )
}
