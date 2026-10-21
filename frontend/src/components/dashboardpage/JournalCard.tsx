import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import Tooltip from "../Tooltip.tsx";

// Placeholder note until journal entries are stored in the backend
const NOTE = {
    quote: 'Courage isn’t the absence of fear. Stark is already my favorite.',
    source: 'Frieren · After episode 6',
    date: '2026-10-16',
}

const RECENT_ACTIVITY = 'Today · Read 32 pages of The Left Hand of Darkness'

export default function JournalCard() {
    const noteDate = new Date(`${NOTE.date}T00:00`).toLocaleDateString('en-US', {
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

            <blockquote className="m-0 font-serif text-[25px] leading-[1.35] text-ink">
                “{NOTE.quote}”
            </blockquote>

            <div className="flex flex-col gap-1.5">
                <p className="m-0 text-[14px] text-ink-soft">{NOTE.source}</p>
                <p className="m-0 text-[13px] text-ink-muted">
                    <time dateTime={NOTE.date}>{noteDate}</time> · Only you
                </p>
            </div>

            <hr className="m-0 h-px border-0 bg-line" />

            <div className="flex items-center gap-2">
                <Icon src="/space-icons/history.svg" box="size-3.5" className="text-ink-muted" />
                <p className="m-0 flex-1 text-[13px] leading-[1.6] text-ink-muted">{RECENT_ACTIVITY}</p>
            </div>

            <Link to="/journal" className="mt-auto flex items-center gap-1.75 self-start text-[14px] text-accent transition-opacity hover:opacity-80">
                Open your journal
                <Icon src="/featured/arrow-up-right.svg" box="size-[13px]" />
            </Link>
        </section>
    )
}
