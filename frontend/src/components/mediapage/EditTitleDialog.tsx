import {type FormEvent, type ReactNode, useEffect, useRef, useState} from "react";
import Icon from "../Icon.tsx";
import {parseProviderId, providerUrl} from "./providers.ts";
import {PROGRESS_KIND, PROVIDER_LOGOS, PROVIDER_NAMES, RATING_PROVIDERS, type MediaType, type Provider, type Title} from "./titles.ts";
import type {Suggestion, SuggestResult} from "./titleApi.ts";
import ImageChoices, {type ImageOption} from "../ImageChoices.tsx";

const MEDIA_TYPES = Object.keys(PROGRESS_KIND) as MediaType[]

const INPUT = "w-full rounded-md border border-line bg-bg px-3 py-2 text-[15px] text-ink [color-scheme:dark] placeholder:text-ink-muted focus:border-accent focus:outline-none"
const LABEL = "flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted"
const FILE_INPUT = "text-[14px] text-ink-soft file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-line file:bg-surface-raised file:px-3 file:py-2 file:text-ink hover:file:border-accent"
const GHOST_BUTTON = "flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-[14px] text-ink transition-colors hover:border-accent hover:text-accent"

// lock shows a toggle that stops fetching from suggesting or filling this field
function Field({ label, children, className = "", lock }: {
    label: string
    children: ReactNode
    className?: string
    lock?: { locked: boolean, toggle: () => void }
}) {
    return (
        <div className={`relative ${className}`}>
            <label className={LABEL}>{label}{children}</label>
            {lock && (
                <button
                    type="button"
                    aria-pressed={lock.locked}
                    aria-label={`${lock.locked ? "Unlock" : "Lock"} ${label.toLowerCase()}`}
                    title={lock.locked ? "Locked: fetching won’t change this" : "Lock so fetching won’t change this"}
                    onClick={lock.toggle}
                    className={`absolute -top-0.5 right-0 flex cursor-pointer items-center gap-1 text-[12px] transition-colors ${lock.locked ? "text-accent" : "text-ink-muted opacity-60 hover:opacity-100"}`}
                >
                    <Icon src="/space-icons/lock-keyhole.svg" box="size-3" />
                    {lock.locked ? "Locked" : ""}
                </button>
            )}
        </div>
    )
}

// An image with its real pixel size underneath, read once it has loaded
function SizedPreview({ src, alt }: { src: string, alt: string }) {
    const [size, setSize] = useState<string | null>(null)
    return (
        <figure className="m-0 flex flex-col gap-1">
            <img
                src={src}
                alt={alt}
                onLoad={(e) => setSize(`${e.currentTarget.naturalWidth} × ${e.currentTarget.naturalHeight}`)}
                className="h-20 rounded object-cover"
            />
            <figcaption className="text-[12px] text-ink-muted">{size ?? "Measuring…"}</figcaption>
        </figure>
    )
}

// What each fetchable field is called in the dialog
const FIELD_LABELS: Record<string, string> = {
    title: "Title", originalTitle: "Original title", creator: "Creator", releaseYear: "Year",
    endYear: "Last year", format: "Format", synopsis: "Description", total: "Length",
    unitMinutes: "Minutes each", tags: "Genres", cover: "Cover", backdrop: "Wide artwork",
}

function shown(value: unknown) {
    if (value === null || value === undefined || value === "") return "Empty"
    if (Array.isArray(value)) return value.join(", ")
    return String(value)
}

function Group({ title, hint, children }: { title: string, hint?: string, children: ReactNode }) {
    return (
        <fieldset className="m-0 flex flex-col gap-4 border-0 border-t border-line p-0 pt-6 first:border-t-0 first:pt-0">
            <legend className="float-left mb-1 flex w-full flex-col gap-1 p-0">
                <span className="text-[13px] font-semibold text-ink-muted uppercase">{title}</span>
                {hint && <span className="text-[14px] text-ink-muted">{hint}</span>}
            </legend>
            {children}
        </fieldset>
    )
}

type EditTitleDialogProps = {
    title: Title
    open: boolean
    onClose: () => void
    onSave: (title: Title) => Promise<void>
    // Saves the links, refreshes ratings and episodes, and returns what each field could become
    onFetch: (links: Record<string, string>) => Promise<SuggestResult>
    // Downloads a suggested provider image onto the server and returns its path
    onUseArtwork: (slot: "cover" | "backdrop", url: string) => Promise<string>
    // Every cover or wide artwork the linked sources have, with sizes
    onArtworkOptions: (slot: "cover" | "backdrop") => Promise<ImageOption[]>
    // Uploads an image and returns the path it's served from
    onUpload: (slot: "cover" | "backdrop", file: File) => Promise<string>
    // Removes the title and everything tracked for it
    onDelete: () => Promise<void>
}

export default function EditTitleDialog({ title, open, onClose, onSave, onFetch, onUseArtwork, onArtworkOptions, onUpload, onDelete }: EditTitleDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [draft, setDraft] = useState(title)
    // Tags are edited as one comma-separated line
    const [tags, setTags] = useState(title.tags.join(", "))
    const [busy, setBusy] = useState<"saving" | "fetching" | "uploading" | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [problems, setProblems] = useState<Record<string, string> | null>(null)
    // Fetched values waiting for you to use or ignore
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    // The artwork picker: which slot is open and what the sources offer
    const [picking, setPicking] = useState<{ slot: "cover" | "backdrop", options: ImageOption[] | null } | null>(null)
    // Removing asks twice, since it also deletes progress and notes
    const [confirmDelete, setConfirmDelete] = useState(false)

    // showModal gives focus trapping, Escape to close and the backdrop for free
    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (open && !dialog.open) {
            setDraft(title)
            setTags(title.tags.join(", "))
            setError(null)
            setProblems(null)
            setSuggestions([])
            setPicking(null)
            setConfirmDelete(false)
            dialog.showModal()
        } else if (!open && dialog.open) {
            dialog.close()
        }
    }, [open, title])

    function set<K extends keyof Title>(key: K, value: Title[K]) {
        setDraft((d) => ({ ...d, [key]: value }))
    }

    function setDetail(i: number, field: "label" | "value", value: string) {
        set("details", draft.details.map((d, j) => (j === i ? { ...d, [field]: value } : d)))
    }

    async function save(e: FormEvent) {
        e.preventDefault()
        setBusy("saving")
        setError(null)
        try {
            await onSave({
                ...draft,
                title: draft.title.trim() || title.title,
                tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                details: draft.details.filter((d) => d.label.trim() && d.value.trim()),
            })
            onClose()
        } catch {
            setError("Couldn’t save. Check the fields and try again.")
        } finally {
            setBusy(null)
        }
    }

    async function fetchNow() {
        setBusy("fetching")
        setError(null)
        try {
            const result = await onFetch(draft.links ?? {})
            setProblems(result.problems)
            setSuggestions(result.suggestions)
        } catch {
            setError("Couldn’t reach the server to fetch.")
        } finally {
            setBusy(null)
        }
    }

    async function openPicker(slot: "cover" | "backdrop") {
        setPicking({ slot, options: null })
        try {
            setPicking({ slot, options: await onArtworkOptions(slot) })
        } catch {
            setPicking(null)
            setError("Couldn’t load images from your sources.")
        }
    }

    async function pick(option: ImageOption) {
        if (!picking) return
        const slot = picking.slot
        setBusy("uploading")
        try {
            set(slot, await onUseArtwork(slot, option.url))
            setPicking(null)
        } catch {
            setError("Couldn’t download that image.")
        } finally {
            setBusy(null)
        }
    }

    const locked = (field: string) => draft.lockedFields?.includes(field) ?? false
    function lock(field: string) {
        return {
            locked: locked(field),
            toggle: () => {
                const current = draft.lockedFields ?? []
                set("lockedFields", locked(field) ? current.filter((f) => f !== field) : [...current, field])
                // Locking a field drops its waiting suggestion
                setSuggestions((list) => list.filter((s) => s.field !== field))
            },
        }
    }

    // Puts a suggestion into the form; it's saved with everything else
    async function accept(s: Suggestion) {
        const v = s.value
        switch (s.field) {
            case "title": set("title", String(v)); break
            case "originalTitle": set("originalTitle", String(v)); break
            case "creator": set("creator", String(v)); break
            case "format": set("format", String(v)); break
            case "synopsis": set("synopsis", String(v)); break
            case "total": set("total", Number(v)); break
            case "unitMinutes": set("episodeMinutes", Number(v)); break
            case "tags": setTags((v as string[]).join(", ")); break
            case "releaseYear": {
                set("year", Number(v))
                const end = draft.yearRange?.match(/\d{4}\D+(\d{4})/)?.[1]
                set("yearRange", end ? `${v}–${end}` : undefined)
                break
            }
            case "endYear": set("yearRange", `${draft.year ?? v}–${v}`); break
            case "cover":
            case "backdrop": {
                setBusy("uploading")
                try {
                    set(s.field, await onUseArtwork(s.field, String(v)))
                } catch {
                    setError("Couldn’t download that image.")
                    setBusy(null)
                    return
                }
                setBusy(null)
                break
            }
        }
        setSuggestions((list) => list.filter((x) => x !== s))
    }

    async function acceptAll() {
        for (const s of suggestions) await accept(s)
    }

    async function upload(slot: "cover" | "backdrop", file: File | undefined) {
        if (!file) return
        setBusy("uploading")
        setError(null)
        try {
            const path = await onUpload(slot, file)
            set(slot, path)
        } catch {
            setError("Couldn’t upload that image. Use a JPG, PNG, WebP or GIF under 15 MB.")
        } finally {
            setBusy(null)
        }
    }

    const providers = RATING_PROVIDERS[draft.type]

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            aria-labelledby="edit-title-heading"
            className="m-auto max-h-[90vh] w-[min(48rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface p-0 text-ink [color-scheme:dark] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
        >
            <form onSubmit={save} className="flex max-h-[90vh] flex-col">
                <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
                    <div className="flex flex-col gap-1">
                        <h2 id="edit-title-heading" className="m-0 font-serif text-[27px] font-normal">Edit title</h2>
                        <p className="m-0 text-[14px] text-ink-muted">Your changes only live in your library.</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink">
                        <Icon src="/x.svg" box="size-4.5" />
                    </button>
                </header>

                <div className="flex flex-col gap-6 overflow-y-auto px-6 py-6 [scrollbar-color:var(--color-line)_transparent]">
                    <Group title="Linked sources" hint="Paste a link or an id. Metadata and ratings are matched by these.">
                        {providers.length === 0 ? (
                            <p className="m-0 text-[14px] text-ink-muted">No sources are set up for {draft.type.toLowerCase()}s yet.</p>
                        ) : providers.map((provider) => {
                            const id = draft.links?.[provider] ?? ""
                            const url = providerUrl(provider, draft.type, id)
                            const logo = PROVIDER_LOGOS[provider]
                            return (
                                <div key={provider} className="flex items-end gap-3">
                                    <Field label={PROVIDER_NAMES[provider]} className="flex-1">
                                        <div className="relative">
                                            {logo && <img src={logo} alt="" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 rounded-sm" />}
                                            <input
                                                value={id}
                                                onChange={(e) => set("links", { ...draft.links, [provider]: parseProviderId(provider, e.target.value) })}
                                                placeholder="Link or id"
                                                className={`${INPUT} ${logo ? "pl-9" : ""}`}
                                            />
                                        </div>
                                    </Field>
                                    {url ? (
                                        <a href={url} target="_blank" rel="noopener noreferrer" className={GHOST_BUTTON}>
                                            Open
                                            <Icon src="/featured/arrow-up-right.svg" box="size-3.5" />
                                        </a>
                                    ) : (
                                        <span className={`${GHOST_BUTTON} invisible`} aria-hidden="true">Open</span>
                                    )}
                                </div>
                            )
                        })}
                        {providers.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <button type="button" onClick={fetchNow} disabled={busy !== null} className={`${GHOST_BUTTON} self-start disabled:opacity-50`}>
                                    {busy === "fetching" ? "Fetching…" : "Save links and fetch"}
                                </button>
                                <p className="m-0 text-[13px] text-ink-muted">
                                    Ratings and episodes update straight away. For your fields you’ll see what each source suggests, and choose what to use.
                                </p>
                                {suggestions.length > 0 && (
                                    <section aria-label="Suggestions from your sources" className="flex flex-col gap-3 rounded-md border border-accent/40 bg-accent-soft/40 p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="m-0 text-[15px] font-semibold text-ink">
                                                {suggestions.length} {suggestions.length === 1 ? "suggestion" : "suggestions"} from your sources
                                            </p>
                                            <div className="flex gap-3">
                                                <button type="button" disabled={busy !== null} onClick={() => void acceptAll()} className="cursor-pointer text-[14px] font-semibold text-accent hover:opacity-80 disabled:opacity-50">Use all</button>
                                                <button type="button" onClick={() => setSuggestions([])} className="cursor-pointer text-[14px] text-ink-soft hover:text-ink">Ignore all</button>
                                            </div>
                                        </div>
                                        <ul className="m-0 flex list-none flex-col gap-2 p-0">
                                            {suggestions.map((s) => {
                                                const image = s.field === "cover" || s.field === "backdrop"
                                                const logo = PROVIDER_LOGOS[s.provider]
                                                return (
                                                    <li key={s.field} className="flex flex-col gap-2 rounded-md bg-surface p-3">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <p className="m-0 flex items-center gap-2 text-[13px] font-semibold text-ink-muted uppercase">
                                                                {FIELD_LABELS[s.field] ?? s.field}
                                                                <span className="flex items-center gap-1 font-normal normal-case">
                                                                    from {logo && <img src={logo} alt="" className="size-3.5 rounded-sm" />}{PROVIDER_NAMES[s.provider]}
                                                                </span>
                                                            </p>
                                                            <div className="flex gap-3">
                                                                <button type="button" disabled={busy !== null} onClick={() => void accept(s)} className="cursor-pointer text-[14px] font-semibold text-accent hover:opacity-80 disabled:opacity-50">Use</button>
                                                                <button type="button" onClick={() => setSuggestions((list) => list.filter((x) => x !== s))} className="cursor-pointer text-[14px] text-ink-soft hover:text-ink">Ignore</button>
                                                                <button type="button" onClick={() => lock(s.field).toggle()} className="flex cursor-pointer items-center gap-1 text-[14px] text-ink-soft hover:text-ink">
                                                                    <Icon src="/space-icons/lock-keyhole.svg" box="size-3" />
                                                                    Lock
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {image ? (
                                                            <div className="flex flex-wrap items-center gap-3 text-[13px] text-ink-muted">
                                                                {s.current ? <SizedPreview src={String(s.current)} alt="Current" /> : <span>Empty</span>}
                                                                <span aria-hidden="true">→</span>
                                                                <SizedPreview src={`/api/images?url=${encodeURIComponent(String(s.value))}`} alt="Suggested" />
                                                                <button type="button" onClick={() => void openPicker(s.field as "cover" | "backdrop")} className="cursor-pointer text-[14px] text-accent hover:opacity-80">
                                                                    See every option and size
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="grid gap-1 text-[14px] sm:grid-cols-2 sm:gap-3">
                                                                <p className="m-0 line-clamp-3 text-ink-muted"><span className="sr-only">Now: </span><s>{shown(s.current)}</s></p>
                                                                <p className="m-0 line-clamp-3 text-ink"><span className="sr-only">Suggested: </span>{shown(s.value)}</p>
                                                            </div>
                                                        )}
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    </section>
                                )}
                                {problems && (
                                    <ul role="status" className="m-0 flex list-none flex-col gap-1 p-0 text-[14px]">
                                        {Object.keys(problems).length === 0
                                            ? <li className="text-accent">Fetched from every linked source. Ratings and episodes are up to date{suggestions.length ? "; review the suggestions above" : "; nothing new for your fields"}.</li>
                                            : Object.entries(problems).map(([p, msg]) => (
                                                <li key={p} className="text-ink-soft">
                                                    <span className="text-ink">{PROVIDER_NAMES[p as Provider] ?? "Artwork"}:</span> {msg}
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </Group>

                    <Group title="Title">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Title" lock={lock("title")}><input required value={draft.title} onChange={(e) => set("title", e.target.value)} className={INPUT} /></Field>
                            <Field label="Subtitle"><input value={draft.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value || undefined)} className={INPUT} /></Field>
                            <Field label="Original title" lock={lock("originalTitle")}><input value={draft.originalTitle ?? ""} onChange={(e) => set("originalTitle", e.target.value || undefined)} className={INPUT} /></Field>
                            <Field label="Media type">
                                <select value={draft.type} onChange={(e) => set("type", e.target.value as MediaType)} className={INPUT}>
                                    {MEDIA_TYPES.map((t) => <option key={t}>{t}</option>)}
                                </select>
                            </Field>
                            <Field label="Creator" lock={lock("creator")}><input value={draft.creator} onChange={(e) => set("creator", e.target.value)} className={INPUT} /></Field>
                            <Field label="Format" lock={lock("format")}><input value={draft.format ?? ""} placeholder="e.g. TV series" onChange={(e) => set("format", e.target.value || undefined)} className={INPUT} /></Field>
                            <Field label="Year" lock={lock("releaseYear")}><input type="number" value={draft.year ?? ""} onChange={(e) => set("year", e.target.value ? Number(e.target.value) : undefined)} className={INPUT} /></Field>
                            <Field label="Years it ran" lock={lock("endYear")}><input value={draft.yearRange ?? ""} placeholder="e.g. 2023–2024" onChange={(e) => set("yearRange", e.target.value || undefined)} className={INPUT} /></Field>
                            <Field label="Age rating"><input value={draft.ageRating ?? ""} placeholder="e.g. TV-14" onChange={(e) => set("ageRating", e.target.value || undefined)} className={INPUT} /></Field>
                            <Field label={`Length (${draft.unit.split(" ")[0]})`} lock={lock("total")}><input type="number" min={1} value={draft.total} onChange={(e) => set("total", Math.max(1, Number(e.target.value)))} className={INPUT} /></Field>
                            {PROGRESS_KIND[draft.type] === "episodes" && (
                                <Field label="Minutes per episode" lock={lock("unitMinutes")}>
                                    <input type="number" min={1} value={draft.episodeMinutes ?? ""} onChange={(e) => set("episodeMinutes", e.target.value ? Number(e.target.value) : undefined)} className={INPUT} />
                                </Field>
                            )}
                        </div>
                        <Field label="Description" lock={lock("synopsis")}>
                            <textarea rows={5} value={draft.synopsis} onChange={(e) => set("synopsis", e.target.value)} className={`${INPUT} resize-y leading-relaxed`} />
                        </Field>
                        <Field label="Genres" lock={lock("tags")}><input value={tags} placeholder="Comma separated" onChange={(e) => setTags(e.target.value)} className={INPUT} /></Field>
                    </Group>

                    <Group title="Artwork" hint="Uploads are stored on your server. Fetched artwork is downloaded there too, never loaded from the provider.">
                        <div className="flex gap-4">
                            <img src={draft.cover} alt="" className="h-24 w-16 shrink-0 rounded object-cover" />
                            <div className="flex flex-1 flex-col gap-4">
                                <Field label="Cover" lock={lock("cover")}>
                                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy !== null} onChange={(e) => upload("cover", e.target.files?.[0])} className={FILE_INPUT} />
                                </Field>
                                <Field label="Wide artwork" lock={lock("backdrop")}>
                                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy !== null} onChange={(e) => upload("backdrop", e.target.files?.[0])} className={FILE_INPUT} />
                                </Field>
                                {busy === "uploading" && <p role="status" className="m-0 text-[13px] text-ink-muted">Saving image…</p>}
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={() => void openPicker("cover")} className={GHOST_BUTTON}>Choose a cover from sources</button>
                                    <button type="button" onClick={() => void openPicker("backdrop")} className={GHOST_BUTTON}>Choose wide artwork from sources</button>
                                </div>
                            </div>
                        </div>
                    </Group>

                    {picking && (
                        <section aria-label={picking.slot === "cover" ? "Covers from your sources" : "Wide artwork from your sources"} className="flex flex-col gap-3 rounded-md border border-line p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="m-0 text-[15px] font-semibold text-ink">
                                    {picking.slot === "cover" ? "Covers" : "Wide artwork"} from your sources
                                </p>
                                <button type="button" onClick={() => setPicking(null)} className="cursor-pointer text-[14px] text-ink-soft hover:text-ink">Close</button>
                            </div>
                            <p className="m-0 text-[13px] text-ink-muted">
                                Sizes are in pixels. {picking.slot === "backdrop" ? "Wide artwork looks best at 1920 × 1080 or larger." : "Covers look best at 600 × 900 or larger."}
                            </p>
                            {picking.options === null
                                ? <p role="status" className="m-0 text-[14px] text-ink-muted">Looking up images and their sizes…</p>
                                : <ImageChoices options={picking.options} wide={picking.slot === "backdrop"} busy={busy !== null} onChoose={(o) => void pick(o)} />}
                        </section>
                    )}

                    <Group title="Details" hint="Shown in the details list, e.g. Studio, Narrator or Platforms.">
                        {draft.details.map((d, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <input aria-label="Detail name" value={d.label} placeholder="Name" onChange={(e) => setDetail(i, "label", e.target.value)} className={`${INPUT} w-2/5`} />
                                <input aria-label="Detail value" value={d.value} placeholder="Value" onChange={(e) => setDetail(i, "value", e.target.value)} className={INPUT} />
                                <button
                                    type="button"
                                    onClick={() => set("details", draft.details.filter((_, j) => j !== i))}
                                    aria-label={`Remove ${d.label || "detail"}`}
                                    className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink"
                                >
                                    <Icon src="/x.svg" box="size-4" />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => set("details", [...draft.details, { label: "", value: "" }])} className={`${GHOST_BUTTON} self-start`}>
                            <Icon src="/plus.svg" box="size-4" />
                            Add detail
                        </button>
                    </Group>
                </div>

                <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-6 py-4">
                    <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => {
                            if (!confirmDelete) return setConfirmDelete(true)
                            setBusy("saving")
                            onDelete().catch(() => {
                                setError("Couldn’t remove this title.")
                                setBusy(null)
                            })
                        }}
                        className={`mr-auto cursor-pointer text-[14px] disabled:opacity-50 ${confirmDelete ? "font-semibold text-ink" : "text-ink-muted hover:text-ink"}`}
                    >
                        {confirmDelete ? "Remove it, with its progress and notes" : "Remove from library"}
                    </button>
                    {error && <p role="alert" className="m-0 text-[14px] text-ink">{error}</p>}
                    <button type="button" onClick={onClose} className={GHOST_BUTTON}>Cancel</button>
                    <button type="submit" disabled={busy !== null} className="disabled:opacity-50 cursor-pointer rounded-md border border-accent bg-accent px-4 py-2 text-[14px] font-semibold text-bg transition-opacity hover:opacity-90">
                        {busy === "saving" ? "Saving…" : "Save changes"}
                    </button>
                </footer>
            </form>
        </dialog>
    )
}
