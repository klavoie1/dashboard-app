import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";

export default function EpisodeToolbar({ seriesLink, total, hasScreenshots, onEdit }: { seriesLink: string, total: number, hasScreenshots: boolean, onEdit?: () => void }) {
    const tabs = [
        { href: "#overview", label: "Overview" },
        ...(hasScreenshots ? [{ href: "#screenshots", label: "Screenshots" }] : []),
        { href: "#notes", label: "Your notes" },
    ]

    return (
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-line">
            <nav aria-label="Episode sections" className="flex h-16 gap-8 overflow-x-auto [scrollbar-width:none]">
                {tabs.map((tab) => (
                    <a
                        key={tab.href}
                        href={tab.href}
                        className="flex h-full items-center border-b-2 border-transparent text-[15px] whitespace-nowrap text-ink-soft transition-colors hover:border-accent hover:text-accent"
                    >
                        {tab.label}
                    </a>
                ))}
            </nav>
            <div className="flex items-center gap-3">
                {onEdit && (
                    <button type="button" onClick={onEdit} className="flex cursor-pointer items-center gap-2 rounded-md border border-line px-3.25 py-2.5 text-[15px] text-ink-soft transition-colors hover:border-accent hover:text-accent">
                        <Icon src="/pencil.svg" box="size-4" />
                        Edit episode
                    </button>
                )}
                <Link
                    to={seriesLink}
                    className="flex items-center gap-2 rounded-md border border-line bg-surface-raised px-3.25 py-2.5 text-[15px] font-semibold text-ink transition-colors hover:border-accent"
                >
                    <Icon src="/episode-icons/list.svg" box="size-4" />
                    Back to all {total} episodes
                </Link>
            </div>
        </div>
    )
}
