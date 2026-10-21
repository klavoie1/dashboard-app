import {type FormEvent, type ReactNode, useEffect, useRef, useState} from "react";
import {api} from "../../api.ts";
import Icon from "../Icon.tsx";
import ImageChoices, {type ImageOption} from "../ImageChoices.tsx";
import {PROVIDER_LOGOS, PROVIDER_NAMES, type Provider} from "../mediapage/titles.ts";
import type {Suggestion} from "../mediapage/titleApi.ts";
import {CHARACTER_PROVIDERS, parseDetails, portraitOf, type Character} from "./characterApi.ts";

const INPUT = "w-full rounded-md border border-line bg-bg px-3 py-2 text-[15px] text-ink [color-scheme:dark] placeholder:text-ink-muted focus:border-accent focus:outline-none"
const LABEL = "flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted"
const GHOST_BUTTON = "flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-[14px] text-ink transition-colors hover:border-accent hover:text-accent"

const FIELD_LABELS: Record<string, string> = { name: "Name", nativeName: "Native name", about: "About", details: "Details" }

// Character pages on each source, for the Open buttons
const CHARACTER_URLS: Partial<Record<Provider, (id: string) => string>> = {
    anilist: (id) => `https://anilist.co/character/${id}`,
    myanimelist: (id) => `https://myanimelist.net/character/${id}`,
    tvmaze: (id) => `https://www.tvmaze.com/characters/${id}`,
}

// Pulls the id out of a pasted character link
function parseCharacterId(provider: Provider, input: string) {
    const patterns: Partial<Record<Provider, RegExp>> = {
        anilist: /anilist\.co\/character\/(\d+)/,
        myanimelist: /myanimelist\.net\/character\/(\d+)/,
        tvmaze: /tvmaze\.com\/characters\/(\d+)/,
    }
    return input.trim().match(patterns[provider] ?? /$^/)?.[1] ?? input.trim()
}

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

type Draft = {
    name: string
    nativeName: string
    role: string
    about: string
    details: { label: string, value: string }[]
    links: Partial<Record<Provider, string>>
    lockedFields: string[]
    portrait: string | null
}

const toDraft = (c: Character): Draft => ({
    name: c.name, nativeName: c.nativeName ?? "", role: c.role ?? "", about: c.about ?? "",
    details: parseDetails(c.details), links: { ...c.links }, lockedFields: [...c.lockedFields], portrait: c.portrait,
})

export default function EditCharacterDialog({ character, open, onClose, onSaved, onDeleted }: {
    character: Character
    open: boolean
    onClose: () => void
    onSaved: (c: Character) => void
    onDeleted: () => void
}) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [draft, setDraft] = useState<Draft>(() => toDraft(character))
    const [busy, setBusy] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [portraits, setPortraits] = useState<ImageOption[] | null>(null)
    const [problems, setProblems] = useState<Record<string, string> | null>(null)
    const [confirmDelete, setConfirmDelete] = useState(false)

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (open && !dialog.open) {
            setDraft(toDraft(character))
            setError(null)
            setSuggestions([])
            setPortraits(null)
            setProblems(null)
            setConfirmDelete(false)
            dialog.showModal()
        } else if (!open && dialog.open) {
            dialog.close()
        }
    }, [open, character])

    const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))
    const locked = (field: string) => draft.lockedFields.includes(field)
    const lock = (field: string) => ({
        locked: locked(field),
        toggle: () => {
            set("lockedFields", locked(field) ? draft.lockedFields.filter((f) => f !== field) : [...draft.lockedFields, field])
            setSuggestions((list) => list.filter((s) => s.field !== field))
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

    // Links are sent in full, so a cleared box unlinks that source
    const saveLinks = () => api.put<Character>(`/characters/${character.id}/links`,
        Object.fromEntries(CHARACTER_PROVIDERS.map((p) => [p, draft.links[p] ?? ""])))

    async function fetchNow() {
        await run("fetching", async () => {
            await saveLinks()
            const { data } = await api.post<{ suggestions: Suggestion[], portraits: ImageOption[], problems: Record<string, string> }>(
                `/characters/${character.id}/suggest`)
            setSuggestions(data.suggestions)
            setPortraits(locked("portrait") ? null : data.portraits)
            setProblems(data.problems)
        }, "Couldn’t reach the server to fetch.")
    }

    function accept(s: Suggestion) {
        const v = s.value
        if (s.field === "name") set("name", String(v))
        if (s.field === "nativeName") set("nativeName", String(v))
        if (s.field === "about") set("about", String(v))
        if (s.field === "details") set("details", parseDetails(String(v)))
        setSuggestions((list) => list.filter((x) => x !== s))
    }

    async function choosePortrait(o: ImageOption) {
        const updated = await run("portrait", () => api.post<Character>(`/characters/${character.id}/portrait/from-url`, { url: o.url }), "Couldn’t download that image.")
        if (updated) {
            set("portrait", updated.data.portrait)
            setPortraits(null)
        }
    }

    async function upload(file: File | undefined) {
        if (!file) return
        const form = new FormData()
        form.append("file", file)
        const updated = await run("portrait", () => api.post<Character>(`/characters/${character.id}/portrait`, form),
            "Couldn’t upload that image. Use a JPG, PNG, WebP or GIF under 15 MB.")
        if (updated) set("portrait", updated.data.portrait)
    }

    async function save(e: FormEvent) {
        e.preventDefault()
        const saved = await run("saving", async () => {
            await saveLinks()
            return api.put<Character>(`/characters/${character.id}`, {
                name: draft.name.trim() || character.name,
                nativeName: draft.nativeName,
                role: draft.role,
                about: draft.about,
                details: JSON.stringify(draft.details.filter((d) => d.label.trim() && d.value.trim())),
                lockedFields: draft.lockedFields,
            })
        }, "Couldn’t save. Check the fields and try again.")
        if (saved) {
            onSaved(saved.data)
            onClose()
        }
    }

    async function remove() {
        if (!confirmDelete) return setConfirmDelete(true)
        const done = await run("saving", () => api.delete(`/characters/${character.id}`), "Couldn’t remove this character.")
        if (done) onDeleted()
    }

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            aria-labelledby="edit-character-heading"
            className="m-auto max-h-[90vh] w-[min(46rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface p-0 text-ink [color-scheme:dark] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
        >
            <form onSubmit={save} className="flex max-h-[90vh] flex-col">
                <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
                    <h2 id="edit-character-heading" className="m-0 font-serif text-[27px] font-normal">Edit character</h2>
                    <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink">
                        <Icon src="/x.svg" box="size-4.5" />
                    </button>
                </header>

                <div className="flex flex-col gap-6 overflow-y-auto px-6 py-6 [scrollbar-color:var(--color-line)_transparent]">
                    <fieldset className="m-0 flex flex-col gap-4 border-0 p-0">
                        <legend className="mb-1 p-0 text-[13px] font-semibold text-ink-muted uppercase">Linked sources</legend>
                        {CHARACTER_PROVIDERS.filter((p) => (p !== "tmdb" && p !== "igdb") || draft.links[p]).map((p) => {
                            const id = draft.links[p] ?? ""
                            const url = id && CHARACTER_URLS[p]?.(id)
                            const logo = PROVIDER_LOGOS[p]
                            return (
                                <div key={p} className="flex items-end gap-3">
                                    <label className={`${LABEL} flex-1`}>
                                        {PROVIDER_NAMES[p]}
                                        <div className="relative">
                                            {logo && <img src={logo} alt="" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 rounded-sm" />}
                                            <input value={id} placeholder="Character link or id" onChange={(e) => set("links", { ...draft.links, [p]: parseCharacterId(p, e.target.value) })} className={`${INPUT} ${logo ? "pl-9" : ""}`} />
                                        </div>
                                    </label>
                                    {url ? (
                                        <a href={url} target="_blank" rel="noopener noreferrer" className={GHOST_BUTTON}>Open <Icon src="/featured/arrow-up-right.svg" box="size-3.5" /></a>
                                    ) : <span className={`${GHOST_BUTTON} invisible`} aria-hidden="true">Open</span>}
                                </div>
                            )
                        })}
                        <button type="button" onClick={() => void fetchNow()} disabled={busy !== null} className={`${GHOST_BUTTON} self-start disabled:opacity-50`}>
                            {busy === "fetching" ? "Fetching…" : "Save links and fetch"}
                        </button>
                        {problems && Object.keys(problems).length > 0 && (
                            <ul role="status" className="m-0 flex list-none flex-col gap-1 p-0 text-[14px] text-ink-soft">
                                {Object.entries(problems).map(([p, m]) => <li key={p}><span className="text-ink">{PROVIDER_NAMES[p as Provider] ?? "Sources"}:</span> {m}</li>)}
                            </ul>
                        )}
                        {problems && Object.keys(problems).length === 0 && suggestions.length === 0 && (portraits?.length ?? 0) === 0 && (
                            <p role="status" className="m-0 text-[14px] text-accent">Fetched. Nothing new for your fields.</p>
                        )}

                        {suggestions.length > 0 && (
                            <section aria-label="Suggestions from your sources" className="flex flex-col gap-2 rounded-md border border-accent/40 bg-accent-soft/40 p-4">
                                <div className="flex items-center justify-between">
                                    <p className="m-0 text-[15px] font-semibold text-ink">{suggestions.length} {suggestions.length === 1 ? "suggestion" : "suggestions"}</p>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => suggestions.forEach(accept)} className="cursor-pointer text-[14px] font-semibold text-accent hover:opacity-80">Use all</button>
                                        <button type="button" onClick={() => setSuggestions([])} className="cursor-pointer text-[14px] text-ink-soft hover:text-ink">Ignore all</button>
                                    </div>
                                </div>
                                {suggestions.map((s) => (
                                    <div key={s.field} className="flex flex-col gap-2 rounded-md bg-surface p-3">
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
                                        <p className="m-0 line-clamp-4 text-[14px] text-ink">
                                            {s.field === "details" ? parseDetails(String(s.value)).map((d) => `${d.label}: ${d.value}`).join(" · ") : String(s.value)}
                                        </p>
                                    </div>
                                ))}
                            </section>
                        )}
                    </fieldset>

                    <fieldset className="m-0 flex flex-col gap-4 border-0 border-t border-line p-0 pt-6">
                        <legend className="float-left mb-1 p-0 text-[13px] font-semibold text-ink-muted uppercase">Character</legend>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Name" lock={lock("name")}><input required value={draft.name} onChange={(e) => set("name", e.target.value)} className={INPUT} /></Field>
                            <Field label="Native name" lock={lock("nativeName")}><input value={draft.nativeName} onChange={(e) => set("nativeName", e.target.value)} className={INPUT} /></Field>
                        </div>
                        <Field label="Who they are"><input value={draft.role} placeholder="e.g. Elven mage" onChange={(e) => set("role", e.target.value)} className={INPUT} /></Field>
                        <Field label="About" lock={lock("about")}>
                            <textarea rows={6} value={draft.about} onChange={(e) => set("about", e.target.value)} className={`${INPUT} resize-y leading-relaxed`} />
                        </Field>
                    </fieldset>

                    <fieldset className="m-0 flex flex-col gap-4 border-0 border-t border-line p-0 pt-6">
                        <legend className="float-left mb-1 flex w-full items-center justify-between p-0 text-[13px] font-semibold text-ink-muted uppercase">
                            Portrait
                            <button type="button" aria-pressed={locked("portrait")} onClick={lock("portrait").toggle} className={`flex cursor-pointer items-center gap-1 text-[12px] font-normal normal-case ${locked("portrait") ? "text-accent" : "text-ink-muted"}`}>
                                <Icon src="/space-icons/lock-keyhole.svg" box="size-3" />{locked("portrait") ? "Locked" : "Lock"}
                            </button>
                        </legend>
                        <div className="flex gap-4">
                            <img src={portraitOf(draft)} alt="" className="h-28 w-20 shrink-0 rounded object-cover" />
                            <div className="flex flex-col gap-2">
                                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy !== null} onChange={(e) => void upload(e.target.files?.[0])} className="text-[14px] text-ink-soft file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-line file:bg-surface-raised file:px-3 file:py-2 file:text-ink" />
                                {busy === "portrait" && <p role="status" className="m-0 text-[13px] text-ink-muted">Saving portrait…</p>}
                                <p className="m-0 text-[13px] text-ink-muted">Fetching shows the portraits your sources have, with their sizes.</p>
                            </div>
                        </div>
                        {portraits && portraits.length > 0 && (
                            <ImageChoices options={portraits} busy={busy !== null} onChoose={(o) => void choosePortrait(o)} />
                        )}
                    </fieldset>

                    <fieldset className="m-0 flex flex-col gap-3 border-0 border-t border-line p-0 pt-6">
                        <legend className="float-left mb-1 flex w-full items-center justify-between p-0 text-[13px] font-semibold text-ink-muted uppercase">
                            Details
                            <button type="button" aria-pressed={locked("details")} onClick={lock("details").toggle} className={`flex cursor-pointer items-center gap-1 text-[12px] font-normal normal-case ${locked("details") ? "text-accent" : "text-ink-muted"}`}>
                                <Icon src="/space-icons/lock-keyhole.svg" box="size-3" />{locked("details") ? "Locked" : "Lock"}
                            </button>
                        </legend>
                        {draft.details.map((d, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <input aria-label="Detail name" value={d.label} placeholder="e.g. Age" onChange={(e) => set("details", draft.details.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className={`${INPUT} w-2/5`} />
                                <input aria-label="Detail value" value={d.value} placeholder="Value" onChange={(e) => set("details", draft.details.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} className={INPUT} />
                                <button type="button" aria-label={`Remove ${d.label || "detail"}`} onClick={() => set("details", draft.details.filter((_, j) => j !== i))} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink">
                                    <Icon src="/x.svg" box="size-4" />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => set("details", [...draft.details, { label: "", value: "" }])} className={`${GHOST_BUTTON} self-start`}>
                            <Icon src="/plus.svg" box="size-4" />Add detail
                        </button>
                    </fieldset>
                </div>

                <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-6 py-4">
                    <button type="button" disabled={busy !== null} onClick={() => void remove()} className={`mr-auto cursor-pointer text-[14px] disabled:opacity-50 ${confirmDelete ? "font-semibold text-ink" : "text-ink-muted hover:text-ink"}`}>
                        {confirmDelete ? "Remove this character everywhere" : "Remove character"}
                    </button>
                    {error && <p role="alert" className="m-0 text-[14px] text-ink">{error}</p>}
                    <button type="button" onClick={onClose} className={GHOST_BUTTON}>Cancel</button>
                    <button type="submit" disabled={busy !== null} className="cursor-pointer rounded-md border border-accent bg-accent px-4 py-2 text-[14px] font-semibold text-bg hover:opacity-90 disabled:opacity-50">
                        {busy === "saving" ? "Saving…" : "Save changes"}
                    </button>
                </footer>
            </form>
        </dialog>
    )
}
