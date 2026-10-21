import {type FormEvent, useEffect, useState} from "react";
import {api} from "../api.ts";
import {PROVIDER_LOGOS, PROVIDER_NAMES, type Provider} from "../components/mediapage/titles.ts";

type Setting = {
    key: string
    label: string
    provider: Provider
    secret: boolean
    configured: boolean
    source: "saved" | "environment" | null
    help: string | null
}

type Storage = {
    path: string
    writable: boolean
    freeBytes: number
    folders: Record<string, { files: number, bytes: number }>
}

const FOLDER_LABELS: Record<string, string> = {
    artwork: "Covers and wide artwork", gallery: "Galleries", episodes: "Episode screenshots", characters: "Character portraits",
}

function size(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

// Where images live. The folder is MEDIA_ROOT; in Docker it's a mounted volume, so you choose where on your machine.
function StorageSection() {
    const [storage, setStorage] = useState<Storage | null>(null)
    const [failed, setFailed] = useState(false)
    useEffect(() => { api.get<Storage>("/settings/storage").then((r) => setStorage(r.data)).catch(() => setFailed(true)) }, [])

    return (
        <section className="flex flex-col gap-4">
            <h2 className="m-0 text-[13px] font-semibold text-ink-muted uppercase">Images and storage</h2>
            <div className="flex flex-col gap-4 rounded-xl bg-surface p-6">
                {failed && <p className="m-0 text-[15px] text-ink">Couldn’t read the storage folder.</p>}
                {storage && (
                    <>
                        <div className="flex flex-col gap-1.5">
                            <p className="m-0 text-[14px] text-ink-muted">Every image you upload or fetch is saved in</p>
                            <code className="rounded-md bg-bg px-3 py-2 text-[15px] break-all text-ink">{storage.path}</code>
                            <p className={`m-0 text-[13px] ${storage.writable ? "text-ink-muted" : "text-ink"}`}>
                                {storage.writable ? `${size(storage.freeBytes)} free on this drive.` : "The server can’t write to this folder. Check its permissions."}
                            </p>
                        </div>
                        <dl className="m-0 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                            {Object.entries(storage.folders).map(([name, f]) => (
                                <div key={name} className="flex justify-between gap-4 border-b border-line pb-2 text-[14px]">
                                    <dt className="text-ink-soft">{FOLDER_LABELS[name] ?? name}</dt>
                                    <dd className="m-0 text-ink-muted">{f.files} {f.files === 1 ? "file" : "files"} · {size(f.bytes)}</dd>
                                </div>
                            ))}
                        </dl>
                        <div className="flex flex-wrap items-center gap-3">
                            <a href="/api/export" download className="rounded-md border border-line bg-surface-raised px-3.5 py-2 text-[14px] font-semibold text-ink hover:border-accent">
                                Export your library
                            </a>
                            <p className="m-0 text-[13px] text-ink-muted">One JSON file with every title, episode, note, review and character. Back up the image folder alongside it.</p>
                        </div>
                        <p className="m-0 text-[14px] leading-relaxed text-ink-muted">
                            To keep images somewhere else, set <code className="text-ink-soft">MEDIA_ROOT</code> before starting the server.
                            With Docker, mount any folder on your machine there, e.g. <code className="text-ink-soft">- /mnt/photos/keeper:/data/media</code>,
                            and your images stay on that folder even when the container is replaced.
                        </p>
                    </>
                )}
            </div>
        </section>
    )
}

const INPUT = "w-full rounded-md border border-line bg-bg px-3 py-2 text-[15px] text-ink [color-scheme:dark] placeholder:text-ink-muted focus:border-accent focus:outline-none"

// Sources that work without any key
const OPEN_SOURCES: { provider: Provider, note: string }[] = [
    { provider: "anilist", note: "Works without a key. Anime, manga and their characters." },
    { provider: "tvmaze", note: "Works without a key. TV shows, every episode, cast and artwork." },
    { provider: "openlibrary", note: "Works without a key. Books, covers, page counts and reader ratings." },
    { provider: "kitsu", note: "Works without a key. Anime and manga, episode thumbnails, posters and banners." },
    { provider: "mangadex", note: "Works without a key. Manga details, reader ratings and every volume cover." },
    { provider: "mangabaka", note: "Links are saved, but fetching from MangaBaka isn’t supported yet." },
]

export default function SettingsPage() {
    const [settings, setSettings] = useState<Setting[] | null>(null)
    // Only keys you've typed into; untouched boxes are left as they are
    const [changes, setChanges] = useState<Record<string, string>>({})
    const [message, setMessage] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        api.get<Setting[]>("/settings").then((r) => setSettings(r.data)).catch(() => setMessage("Couldn’t load settings."))
    }, [])

    async function save(e: FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const { data } = await api.put<Setting[]>("/settings", changes)
            setSettings(data)
            setChanges({})
            setMessage("Saved.")
        } catch {
            setMessage("Couldn’t save. Try again.")
        } finally {
            setSaving(false)
        }
    }

    function clear(key: string) {
        setChanges((c) => ({ ...c, [key]: "" }))
    }

    const providers = [...new Set(settings?.map((s) => s.provider))]

    return (
        <main className="flex max-w-3xl flex-col gap-8 py-10">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 font-serif text-5xl font-normal text-ink">Settings</h1>
                <p className="m-0 text-base text-ink-soft">
                    Keys stay on your server and are only used to fetch details, ratings and artwork for titles you link.
                </p>
            </div>

            <form onSubmit={save} className="flex flex-col gap-6">
                <h2 className="m-0 text-[13px] font-semibold text-ink-muted uppercase">Metadata sources</h2>

                {settings === null && !message && <p role="status" className="m-0 text-base text-ink-muted">Loading…</p>}

                {providers.map((provider) => (
                    <fieldset key={provider} className="m-0 flex flex-col gap-4 rounded-xl border-0 bg-surface p-6">
                        <legend className="float-left mb-1 flex w-full items-center gap-2.5 p-0 text-lg font-semibold text-ink">
                            {PROVIDER_LOGOS[provider] && <img src={PROVIDER_LOGOS[provider]} alt="" className="size-5 rounded-sm" />}
                            {PROVIDER_NAMES[provider]}
                        </legend>
                        {settings!.filter((s) => s.provider === provider).map((s) => {
                            const cleared = changes[s.key] === ""
                            const status = cleared ? "Will be removed when you save"
                                : s.source === "saved" ? "Saved here"
                                : s.source === "environment" ? "Set by an environment variable"
                                : "Not set"
                            return (
                                <div key={s.key} className="flex flex-col gap-1.5">
                                    <label htmlFor={s.key} className="flex flex-wrap items-baseline justify-between gap-2 text-[14px] font-medium text-ink-soft">
                                        {s.label}
                                        <span className={`text-[13px] font-normal ${s.configured && !cleared ? "text-accent" : "text-ink-muted"}`}>{status}</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            id={s.key}
                                            type={s.secret ? "password" : "text"}
                                            autoComplete="off"
                                            value={changes[s.key] ?? ""}
                                            placeholder={s.configured ? "•••••••• (type to replace)" : "Paste here"}
                                            onChange={(e) => setChanges((c) => ({ ...c, [s.key]: e.target.value }))}
                                            className={INPUT}
                                        />
                                        {s.source === "saved" && (
                                            <button type="button" onClick={() => clear(s.key)} className="cursor-pointer rounded-md border border-line px-3 text-[14px] text-ink-soft hover:border-accent hover:text-ink">
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    {s.help && <p className="m-0 text-[13px] text-ink-muted">{s.help}</p>}
                                </div>
                            )
                        })}
                    </fieldset>
                ))}

                {settings && (
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                        {OPEN_SOURCES.map((s) => (
                            <li key={s.provider} className="flex items-center gap-2.5 text-[15px] text-ink-soft">
                                {PROVIDER_LOGOS[s.provider] && <img src={PROVIDER_LOGOS[s.provider]} alt="" className="size-4 rounded-sm" />}
                                <span className="text-ink">{PROVIDER_NAMES[s.provider]}</span> · {s.note}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={saving || Object.keys(changes).length === 0}
                        className="cursor-pointer rounded-md border border-accent bg-accent px-4 py-2 text-[15px] font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "Save keys"}
                    </button>
                    {message && <p role="status" className="m-0 text-[14px] text-ink-soft">{message}</p>}
                </div>
            </form>

            <StorageSection />
        </main>
    )
}
