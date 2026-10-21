import Icon from "../Icon.tsx";
import Tooltip from "../Tooltip.tsx";
import type {Title} from "./titles.ts";

const SHORT_DATE: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }

export default function TitleNote({ note, onWrite, onEdit }: { note: Title["note"], onWrite?: () => void, onEdit?: () => void }) {
    return (
        <section className="flex flex-col gap-4 rounded-xl bg-surface p-6">
            <div className="flex items-center justify-between">
                <h2 className="m-0 text-[13px] font-semibold text-ink-muted uppercase">A note to remember</h2>
                <Tooltip label="Private · only you can see this" align="end">
                    <Icon src="/space-icons/lock-keyhole.svg" box="size-3.5" className="text-ink-muted" />
                </Tooltip>
            </div>

            {note ? (
                <>
                    <blockquote className="m-0 font-serif text-[24px] leading-[1.4] text-ink">“{note.quote}”</blockquote>
                    <p className="m-0 text-[13px] text-ink-muted">
                        {note.source} · <time dateTime={note.date}>{new Date(`${note.date}T00:00`).toLocaleDateString('en-US', SHORT_DATE)}</time>
                    </p>
                </>
            ) : (
                <p className="m-0 text-[15px] text-ink-muted">Nothing written yet.</p>
            )}

            <div className="flex flex-wrap gap-4">
                <button type="button" onClick={onWrite} className="cursor-pointer text-[14px] text-accent transition-opacity hover:opacity-80">
                    {note ? "Write another note" : "Write a note"}
                </button>
                {note && onEdit && (
                    <button type="button" onClick={onEdit} className="cursor-pointer text-[14px] text-ink-soft transition-colors hover:text-ink">
                        Edit this note
                    </button>
                )}
            </div>
        </section>
    )
}
