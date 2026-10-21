import Icon from "../Icon.tsx";
import Tooltip from "../Tooltip.tsx";
import type {Title} from "./titles.ts";

export default function TitleNote({ note, onWrite }: { note: Title["note"], onWrite?: () => void }) {
    return (
        <section className="flex flex-col gap-4 rounded-xl bg-surface p-6">
            <div className="flex items-center justify-between">
                <h2 className="m-0 text-[12px] font-medium tracking-wider text-ink-muted uppercase">Your notes</h2>
                <Tooltip label="Private · only you can see this" align="end">
                    <Icon src="/space-icons/lock-keyhole.svg" box="size-3.5" className="text-ink-muted" />
                </Tooltip>
            </div>

            {note ? (
                <>
                    <blockquote className="m-0 font-serif text-[25px] leading-[1.35] text-ink">“{note.quote}”</blockquote>
                    <p className="m-0 text-[13px] text-ink-muted">
                        {note.source} · <time dateTime={note.date}>
                            {new Date(`${note.date}T00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </time>
                    </p>
                </>
            ) : (
                <p className="m-0 text-[15px] text-ink-muted">Nothing written yet.</p>
            )}

            <button type="button" onClick={onWrite} className="flex cursor-pointer items-center gap-1.75 self-start text-[14px] text-accent transition-opacity hover:opacity-80">
                Write a note
            </button>
        </section>
    )
}
