import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import {PROVIDER_NAMES, type Provider} from "../mediapage/titles.ts";
import {actorLine, appearanceIn, fetchCast, loadCharacters, partLabel, portraitOf, type Character} from "./characterApi.ts";

// How many characters show before "All characters & cast"
const SHOWN = 8

// "The people along the way" on a title page: its cast, fetched from the linked sources
export default function CastSection({ mediaId, mediaTitle }: { mediaId: number, mediaTitle: string }) {
    const [cast, setCast] = useState<Character[] | null>(null)
    const [busy, setBusy] = useState(false)
    const [note, setNote] = useState<string | null>(null)

    useEffect(() => { void loadCharacters(mediaId).then(setCast).catch(() => setCast([])) }, [mediaId])

    async function fetchNow() {
        setBusy(true)
        setNote(null)
        try {
            const result = await fetchCast(mediaId)
            setCast(result.cast)
            const problems = Object.entries(result.problems)
            setNote(result.source
                ? `Updated from ${PROVIDER_NAMES[result.source]}.${problems.length ? ` ${problems.map(([, m]) => m).join(" ")}` : ""}`
                : problems.map(([p, m]) => `${PROVIDER_NAMES[p as Provider] ?? "Sources"}: ${m}`).join(" ") || "No characters found.")
        } catch {
            setNote("Couldn’t reach the server to fetch characters.")
        } finally {
            setBusy(false)
        }
    }

    return (
        <section id="characters" className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="m-0 font-serif text-3xl font-normal text-ink">The people along the way</h2>
                <div className="flex items-center gap-5">
                    <button type="button" onClick={() => void fetchNow()} disabled={busy} className="cursor-pointer text-[15px] text-ink-soft hover:text-accent disabled:opacity-50">
                        {busy ? "Fetching…" : cast?.length ? "Update cast" : "Fetch characters"}
                    </button>
                    {cast && cast.length > 0 && (
                        <Link to={`/characters?media=${mediaId}`} className="flex items-center gap-2 text-[15px] text-accent hover:opacity-80">
                            All characters &amp; cast
                            <Icon src="/featured/arrow-up-right.svg" box="size-3.5" />
                        </Link>
                    )}
                </div>
            </div>
            {note && <p role="status" className="m-0 text-[14px] text-ink-muted">{note}</p>}

            {cast !== null && cast.length === 0 && !busy && (
                <p className="m-0 text-base text-ink-muted">
                    No characters yet. Fetch them from this title’s linked sources, or add them from the Characters page.
                </p>
            )}

            {cast && cast.length > 0 && (
                <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 md:grid-cols-4">
                    {cast.slice(0, SHOWN).map((c) => {
                        const part = appearanceIn(c, mediaId)
                        return (
                            <li key={c.id} className="group relative flex flex-col overflow-hidden rounded-md bg-surface">
                                <img src={portraitOf(c)} alt="" loading="lazy" className="aspect-3/4 w-full object-cover object-top" />
                                <div className="flex flex-col gap-1.75 p-4">
                                    {/* ::after makes the whole card open the character */}
                                    <Link to={`/characters/${c.id}`} className="truncate text-lg font-semibold text-ink after:absolute after:inset-0 group-hover:text-accent">
                                        {c.name}
                                    </Link>
                                    <p className="m-0 truncate text-[14px] text-ink-soft">
                                        {[partLabel(part?.role ?? null), c.role].filter(Boolean).join(" · ") || "\u00a0"}
                                    </p>
                                    {actorLine(part) && <p className="m-0 truncate text-[13px] text-ink-muted">{actorLine(part)}</p>}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
            {cast && cast.length > SHOWN && (
                <Link to={`/characters?media=${mediaId}`} className="self-start text-[14px] text-accent hover:opacity-80">
                    See all {cast.length} characters from {mediaTitle}
                </Link>
            )}
        </section>
    )
}
