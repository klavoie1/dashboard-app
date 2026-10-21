import Icon from "../Icon.tsx";
import type {EpisodeInfo} from "../mediapage/titles.ts";
import {longDate} from "./format.ts";

export default function EpisodeNote({ note, episode, onEdit }: { note: EpisodeInfo["note"], episode: number, onEdit?: () => void }) {
    return (
        <section id="notes" className="flex flex-col gap-4.5">
            <h2 className="m-0 font-serif text-3xl font-normal text-ink">What stays with you</h2>
            <div className="flex flex-col gap-5 rounded-xl bg-surface p-6">
                <p className="m-0 flex items-center gap-1.75 text-[13px] font-semibold text-ink-muted uppercase">
                    <Icon src="/space-icons/lock-keyhole.svg" box="size-3.25" />
                    Your notes · Only you
                </p>

                {note ? (
                    <>
                        <blockquote className="m-0 font-serif text-[27px] leading-[1.35] text-ink">“{note.quote}”</blockquote>
                        {note.reflection && <p className="m-0 text-[15px] leading-[1.7] text-ink-soft">{note.reflection}</p>}
                    </>
                ) : (
                    <p className="m-0 text-base text-ink-muted">Nothing written for this episode yet.</p>
                )}

                <hr className="m-0 h-px border-0 bg-line" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="m-0 text-[13px] text-ink-muted">
                        {note ? <>After episode {episode} · <time dateTime={note.date}>{longDate(note.date)}</time></> : "Notes stay on your server."}
                    </p>
                    <button
                        type="button"
                        onClick={onEdit}
                        disabled={!onEdit}
                        title={onEdit ? undefined : "Fetch this show's episodes first to write notes on them"}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-line bg-surface-raised px-3.25 py-2.5 text-[15px] font-semibold text-ink transition-colors hover:border-accent disabled:cursor-default disabled:opacity-50"
                    >
                        <Icon src="/pencil.svg" box="size-4" />
                        {note ? "Edit note" : "Write a note"}
                    </button>
                </div>
            </div>
        </section>
    )
}
