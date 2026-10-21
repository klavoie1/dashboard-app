import {useEffect, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {isAxiosError} from "axios";
import {api} from "../api.ts";
import Icon from "../components/Icon.tsx";
import EditCharacterDialog from "../components/characters/EditCharacterDialog.tsx";
import TitleStatus from "../components/mediapage/TitleStatus.tsx";
import MediaGallery from "../components/MediaGallery.tsx";
import {KIND_TO_TYPE, NO_COVER} from "../components/mediapage/titleApi.ts";
import {PROVIDER_LOGOS, PROVIDER_NAMES, type Provider} from "../components/mediapage/titles.ts";
import {actorLine, kindsOf, parseDetails, partLabel, portraitOf, setFavorite, type Character} from "../components/characters/characterApi.ts";

// Where each source shows a character
const SOURCE_URLS: Partial<Record<Provider, (id: string) => string>> = {
    anilist: (id) => `https://anilist.co/character/${id}`,
    myanimelist: (id) => `https://myanimelist.net/character/${id}`,
    tvmaze: (id) => `https://www.tvmaze.com/characters/${id}`,
}

export default function CharacterPage() {
    const {id} = useParams()
    const navigate = useNavigate()
    const [state, setState] = useState<{ id: string | undefined, character: Character | null, status: "ready" | "missing" | "error" } | null>(null)
    const [editing, setEditing] = useState(false)

    useEffect(() => {
        let current = true
        api.get<Character>(`/characters/${id}`)
            .then((r) => current && setState({ id, character: r.data, status: "ready" }))
            .catch((e) => current && setState({ id, character: null, status: isAxiosError(e) && e.response?.status === 404 ? "missing" : "error" }))
        return () => { current = false }
    }, [id])

    if (!state || state.id !== id) return <TitleStatus status="loading" />
    if (!state.character) return <TitleStatus status={state.status as "missing" | "error"} backTo={{ to: "/characters", label: "Back to characters" }} />
    const c = state.character
    const update = (next: Character) => setState({ id, character: next, status: "ready" })
    const details = parseDetails(c.details)
    const sources = Object.entries(c.links) as [Provider, string][]
    const main = c.appearances.find((a) => a.role === "MAIN") ?? c.appearances[0]

    return (
        <main className="pb-16">
            <section className="relative -mx-4 flex min-h-104 flex-col justify-between gap-10 overflow-hidden px-4 pt-7 pb-8 md:mx-0 md:px-8 xl:px-16">
                <img src={portraitOf(c)} alt="" className="absolute inset-0 size-full scale-110 object-cover blur-2xl brightness-40" />
                <div className="absolute inset-0 bg-linear-to-b from-transparent from-40% to-bg" />
                <nav aria-label="Breadcrumb" className="relative">
                    <ol className="m-0 flex list-none flex-wrap items-center gap-2.5 p-0 text-[14px] text-ink-soft">
                        <li><Link to="/characters" className="hover:text-ink">Characters</Link></li>
                        <li aria-hidden="true"><Icon src="/space-icons/chevron-right.svg" box="size-3" /></li>
                        <li aria-current="page" className="text-ink">{c.name}</li>
                    </ol>
                </nav>
                <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-end">
                    <img src={portraitOf(c)} alt="" className="w-44 rounded-md object-cover shadow-2xl md:w-56" />
                    <div className="flex flex-col items-start gap-3">
                        {c.appearances.length > 0 && (
                            <p className="m-0 flex items-center gap-3 text-[13px] font-semibold text-accent uppercase">
                                <span aria-hidden="true" className="block h-0.5 w-7 bg-accent" />
                                {kindsOf(c)}
                            </p>
                        )}
                        <h1 className="m-0 font-serif text-5xl leading-[1.05] font-normal text-ink md:text-[72px]">{c.name}</h1>
                        {c.nativeName && <p className="m-0 font-serif text-[24px] text-ink-soft">{c.nativeName}</p>}
                        <p className="m-0 text-base text-ink-soft">
                            {[c.role, main && `${partLabel(main.role) ?? "Appears"} in ${main.mediaTitle}`].filter(Boolean).join(" · ")}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3">
                            <button
                                type="button"
                                aria-pressed={c.favorite}
                                onClick={() => void setFavorite(c, !c.favorite).then(update)}
                                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3.5 py-2.5 text-[15px] font-semibold transition-colors ${c.favorite ? "border-accent bg-accent text-bg" : "border-line bg-bg/70 text-ink hover:border-accent"}`}
                            >
                                <Icon src="/episode-icons/heart.svg" box="size-4" />
                                {c.favorite ? "One of your favorites" : "Add to favorites"}
                            </button>
                            <button type="button" onClick={() => setEditing(true)} className="flex cursor-pointer items-center gap-2 rounded-md border border-line bg-bg/70 px-3.5 py-2.5 text-[15px] text-ink-soft hover:border-accent hover:text-accent">
                                <Icon src="/pencil.svg" box="size-4" />
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-10 border-t border-line pt-10 lg:grid-cols-[minmax(0,1fr)_23.5rem]">
                <div className="flex flex-col gap-12">
                    <section className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                            <h2 className="m-0 font-serif text-3xl font-normal text-ink">About {c.name}</h2>
                            <p className="m-0 flex items-center gap-1.75 text-[14px] text-ink-muted">
                                <Icon src="/episode-icons/shield-check.svg" box="size-3.5" className="text-accent" />
                                Spoilers left out
                            </p>
                        </div>
                        {c.about
                            ? <p className="m-0 text-base leading-[1.8] whitespace-pre-line text-ink-soft">{c.about}</p>
                            : <p className="m-0 text-base text-ink-muted">Nothing written yet. Edit to add a description, or fetch one from a linked source.</p>}
                    </section>

                    <section className="flex flex-col gap-4">
                        <h2 className="m-0 font-serif text-3xl font-normal text-ink">Appears in</h2>
                        {c.appearances.length === 0 && <p className="m-0 text-base text-ink-muted">Not tied to any title in your library yet.</p>}
                        <ul className="m-0 flex list-none flex-col gap-1 p-0">
                            {c.appearances.map((a) => (
                                <li key={a.mediaId} className="group relative flex items-center gap-4 border-b border-line bg-surface px-4 py-3">
                                    <img src={a.mediaCover ?? NO_COVER} alt="" className="h-16 w-11 shrink-0 rounded-[3px] object-cover" />
                                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                                        <p className="m-0 text-[12px] text-accent uppercase">{KIND_TO_TYPE[a.mediaKind] ?? a.mediaKind}</p>
                                        <Link to={`/library/${a.mediaId}#characters`} className="truncate text-base font-semibold text-ink after:absolute after:inset-0 group-hover:text-accent">
                                            {a.mediaTitle}
                                        </Link>
                                        {actorLine(a) && <p className="m-0 truncate text-[13px] text-ink-muted">Voiced or played by {actorLine(a)}</p>}
                                    </div>
                                    {a.role && <p className="m-0 shrink-0 text-[13px] text-ink-soft uppercase">{partLabel(a.role)}</p>}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <MediaGallery
                        owner="characters"
                        id={c.id}
                        heading={`Pictures of ${c.name}`}
                        hint="Other portraits, favorite scenes, art you love. Stored on your server."
                    />
                </div>

                <aside className="flex flex-col gap-6">
                    <section className="flex flex-col gap-4.5 rounded-xl border border-line p-6">
                        <h2 className="m-0 text-[13px] font-semibold text-ink-muted uppercase">The details</h2>
                        {details.length === 0 ? (
                            <p className="m-0 text-[14px] text-ink-muted">No details yet.</p>
                        ) : (
                            <dl className="m-0 flex flex-col gap-4">
                                {details.map((d) => (
                                    <div key={d.label} className="flex justify-between gap-4 text-[14px]">
                                        <dt className="text-ink-muted">{d.label}</dt>
                                        <dd className="m-0 text-right text-ink-soft">{d.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </section>
                    {sources.length > 0 && (
                        <section className="flex flex-col gap-3 rounded-xl bg-surface p-6">
                            <h2 className="m-0 text-[13px] font-semibold text-ink-muted uppercase">Sources</h2>
                            <ul className="m-0 flex list-none flex-col gap-2 p-0">
                                {sources.map(([p, extId]) => {
                                    const url = SOURCE_URLS[p]?.(extId)
                                    return (
                                        <li key={p} className="flex items-center gap-2 text-[15px] text-ink-soft">
                                            {PROVIDER_LOGOS[p] && <img src={PROVIDER_LOGOS[p]} alt="" className="size-4 rounded-sm" />}
                                            {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{PROVIDER_NAMES[p]} ↗</a> : PROVIDER_NAMES[p]}
                                        </li>
                                    )
                                })}
                            </ul>
                        </section>
                    )}
                </aside>
            </div>

            <EditCharacterDialog
                character={c}
                open={editing}
                onClose={() => setEditing(false)}
                onSaved={update}
                onDeleted={() => navigate("/characters")}
            />
        </main>
    )
}
