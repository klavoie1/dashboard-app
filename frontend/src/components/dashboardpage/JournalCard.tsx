import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import Tooltip from "../Tooltip.tsx";

// A recent note with the title it's about (RecentEntry.java)
export type RecentNote = {
    id: number
    mediaId: number
    mediaTitle: string
    episodeNumber: number | null
    quote: string
    reflection: string | null
    writtenOn: string
}

export default function JournalCard({ note, lastUpdate }: { note: RecentNote | null | undefined, lastUpdate: string | null }) {
    if (note === undefined) return <section aria-busy="true" className="h-full min-h-60 rounded-xl bg-surface" />
    const noteDate = note && new Date(`${note.writtenOn}T00:00`).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })

    return (
        <section className="flex h-full flex-col gap-5 rounded-xl bg-surface p-6">
            <div className="flex items-center justify-between">
                <h2 className="m-0 text-[12px] font-medium tracking-wider text-ink-muted uppercase">
                    A note to remember
                </h2>
                <Tooltip label="Private · only you can see this" align="end">
                    <Icon src="/space-icons/lock-keyhole.svg" box="size-3.5" className="text-ink-muted" />
                </Tooltip>
            </div>

            {note ? (
                <>
                    <blockquote className="m-0 font-serif text-[25px] leading-[1.35] text-ink">
                        “{note.quote}”
                    </blockquote>

                    <div className="flex flex-col gap-1.5">
                        <Link to={`/library/${note.mediaId}`} className="self-start text-[14px] text-ink-soft hover:text-accent">
                            {note.mediaTitle}{note.episodeNumber ? ` · After episode ${note.episodeNumber}` : ""}
                        </Link>
                        <p className="m-0 text-[13px] text-ink-muted">
                            <time dateTime={note.writtenOn}>{noteDate}</time> · Only you
                        </p>
                    </div>
                </>
            ) : (
                <p className="m-0 text-base text-ink-muted">
                    No notes yet. Write one from any title or episode page and it will show up here.
                </p>
            )}

            <hr className="m-0 h-px border-0 bg-line" />

            <div className="flex items-center gap-2">
                <Icon src="/space-icons/history.svg" box="size-3.5" className="text-ink-muted" />
                <p className="m-0 flex-1 text-[13px] leading-[1.6] text-ink-muted">{lastUpdate ?? "No updates logged yet"}</p>
            </div>

            <Link to="/journal" className="mt-auto flex items-center gap-1.75 self-start text-[14px] text-accent transition-opacity hover:opacity-80">
                Open your journal
                <Icon src="/featured/arrow-up-right.svg" box="size-[13px]" />
            </Link>
        </section>
    )
}
