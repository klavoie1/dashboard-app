import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import DiscoverCard from "../discover/DiscoverCard.tsx";
import {addToLibrary, loadDiscover, type Hit, type Shelf} from "../discover/discoverApi.ts";

// How many suggestions the dashboard shows
const SHOWN = 5

// A few suggestions from Discover, one from each shelf first so they span your interests
function sample(shelves: Shelf[]) {
    const picks: { hit: Hit, reason: string }[] = []
    for (let round = 0; picks.length < SHOWN && round < 10; round++) {
        for (const shelf of shelves) {
            const item = shelf.items[round]
            if (item && picks.length < SHOWN) picks.push({ hit: item.hit, reason: shelf.title })
        }
    }
    return picks
}

export default function PersonalDiscovery() {
    const [picks, setPicks] = useState<{ hit: Hit, reason: string }[] | null>(null)
    const [added, setAdded] = useState<Record<string, number>>({})
    const [adding, setAdding] = useState<string | null>(null)

    useEffect(() => { void loadDiscover().then((d) => setPicks(sample(d.shelves))).catch(() => setPicks([])) }, [])

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

    return (
        <section className="flex flex-col gap-6 py-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                    <h2 className="m-0 font-serif text-3xl font-normal text-ink">Your next story is out there</h2>
                    <p className="m-0 text-[15px] text-ink-muted">A few things we think will stay with you, across every medium.</p>
                </div>
                <Link to="/discover" className="flex items-center gap-2 text-[14px] text-accent transition-opacity hover:opacity-80">
                    Explore Discover
                    <Icon src="/featured/arrow-up-right.svg" box="size-[13px]" />
                </Link>
            </div>
            {picks === null && <p role="status" className="m-0 text-[15px] text-ink-muted">Finding ideas…</p>}
            {picks?.length === 0 && (
                <p className="m-0 text-[15px] text-ink-muted">Suggestions appear once your library has a few titles linked to a source.</p>
            )}
            <ul className="m-0 grid list-none grid-cols-2 gap-5 p-0 md:grid-cols-3 lg:grid-cols-5">
                {picks?.map(({ hit, reason }) => {
                    const key = `${hit.provider}:${hit.externalId}`
                    return (
                        <li key={key}>
                            <DiscoverCard hit={hit} reason={reason} mediaId={added[key] ?? null} adding={adding === key} onAdd={() => void add(hit)} />
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
