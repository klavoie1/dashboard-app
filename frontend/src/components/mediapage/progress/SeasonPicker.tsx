import {Link} from "react-router-dom";

export type SeasonOption = {
    label: string
    active: boolean
    // A link for anime seasons (separate entries); a click handler for TV seasons on this page
    to?: string
    onSelect?: () => void
}

// Past this many, tabs would overflow, so it becomes a dropdown
const MAX_TABS = 6

const TAB = "rounded px-3 py-2 text-[14px] whitespace-nowrap text-ink-muted transition-colors hover:text-ink"
const ACTIVE = "bg-surface-raised text-ink"

export default function SeasonPicker({ options, label }: { options: SeasonOption[], label: string }) {
    if (options.length < 2) return null

    if (options.length > MAX_TABS && options.every((o) => o.onSelect)) {
        return (
            <label className="flex items-center gap-3 self-start text-[14px] text-ink-muted">
                {label}
                <select
                    value={options.findIndex((o) => o.active)}
                    onChange={(e) => options[Number(e.target.value)].onSelect?.()}
                    className="cursor-pointer rounded-md border border-line bg-surface px-3 py-2 text-ink [color-scheme:dark] focus:border-accent focus:outline-none"
                >
                    {options.map((o, i) => <option key={o.label} value={i}>{o.label}</option>)}
                </select>
            </label>
        )
    }

    return (
        <nav aria-label={label} className="flex max-w-full gap-1 self-start overflow-x-auto rounded-md bg-surface p-1 [scrollbar-width:none]">
            {options.map((o) => o.to ? (
                <Link key={o.label} to={o.to} aria-current={o.active ? "page" : undefined} className={`${TAB} ${o.active ? ACTIVE : ""}`}>
                    {o.label}
                </Link>
            ) : (
                <button key={o.label} type="button" aria-pressed={o.active} onClick={o.onSelect} className={`${TAB} cursor-pointer ${o.active ? ACTIVE : ""}`}>
                    {o.label}
                </button>
            ))}
        </nav>
    )
}
