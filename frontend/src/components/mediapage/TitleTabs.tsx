import Icon from "../Icon.tsx";
import type {Title} from "./titles.ts";

// In-page section links; the page scrolls rather than switching views
export default function TitleTabs({ title, progressLabel, onEdit }: { title: Title, progressLabel: string, onEdit: () => void }) {
    const inLibrary = title.status !== "Not in library"
    const tabs = [
        { href: "#progress", label: progressLabel },
        { href: "#reviews", label: "Review" },
        { href: "#characters", label: "Characters" },
        { href: "#gallery", label: "Gallery" },
        { href: "#journey", label: "Your journey" },
        { href: "#details", label: "Details" },
        ...(title.related.length > 0 ? [{ href: "#related", label: "Related" }] : []),
    ]

    return (
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-line">
            <nav aria-label="Title sections" className="flex h-16 gap-8 overflow-x-auto [scrollbar-width:none]">
                {tabs.map((tab) => (
                    <a
                        key={tab.href}
                        href={tab.href}
                        className="flex h-full items-center border-b-2 border-transparent text-[15px] whitespace-pre text-ink-soft transition-colors hover:border-accent hover:text-accent"
                    >
                        {tab.label}
                    </a>
                ))}
            </nav>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onEdit}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2.25 text-[15px] text-ink-soft transition-colors hover:border-accent hover:text-accent"
                >
                    <Icon src="/pencil.svg" box="size-4" />
                    Edit
                </button>
                <button
                    type="button"
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-line bg-surface-raised px-3 py-2.25 text-[15px] font-semibold text-ink transition-colors hover:border-accent"
                >
                    <Icon src={inLibrary ? "/featured/check.svg" : "/plus.svg"} box="size-4" className="text-accent" />
                    {inLibrary ? "In your library" : "Add to library"}
                </button>
            </div>
        </div>
    )
}
