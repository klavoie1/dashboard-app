import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import Tooltip from "../Tooltip.tsx";

export type MediaCardProps = {
    // Where clicking the card goes, e.g. the media detail page
    to: string
    type: string
    title: string
    creator: string
    cover: string
    progress: number
    total: number
    unit: string
    hint: string
    actionLabel: string
    onAction?: () => void
}

export default function MediaCard({
    to,
    type,
    title,
    creator,
    cover,
    progress,
    total,
    unit,
    hint,
    actionLabel,
    onAction,
}: MediaCardProps) {
    const percent = total > 0 ? Math.min(100, (progress / total) * 100) : 0

    return (
        <div className="group relative flex h-full flex-col gap-3.5 rounded-md bg-surface p-4 transition-colors hover:bg-surface-raised">
            <div className="flex gap-3.5">
                <img src={cover} alt="" className="h-26 w-18 shrink-0 rounded-[3px] object-cover" />
                <div className="flex flex-col gap-1">
                    <p className="m-0 text-[12px] font-semibold text-accent uppercase">
                        {type}
                    </p>
                    {/* The link's ::after covers the whole card, so the card is clickable; buttons sit above it */}
                    <Link
                        to={to}
                        className="text-lg leading-[1.35] font-semibold text-ink after:absolute after:inset-0 after:rounded-md group-hover:text-accent"
                    >
                        {title}
                    </Link>
                    <p className="m-0 text-[13px] text-ink-muted">
                        {creator}
                    </p>
                </div>
            </div>

            <div className="mt-auto flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <p className="m-0 text-[14px] text-ink-soft">
                        {progress} / {total} {unit}
                    </p>
                    <Tooltip label="More options" className="relative z-10">
                        <button
                            type="button"
                            aria-label={`More options for ${title}`}
                            className="cursor-pointer text-ink-muted transition-colors hover:text-ink"
                        >
                            <Icon src="/ellipsis.svg" box="size-4" />
                        </button>
                    </Tooltip>
                </div>
                <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-valuenow={progress}
                    aria-label={`${title} progress`}
                    className="h-1 w-full overflow-hidden rounded bg-line"
                >
                    <div className="h-full rounded bg-accent" style={{ width: `${percent}%` }} />
                </div>
                <p className="m-0 text-[13px] text-ink-muted">
                    {hint}
                </p>
            </div>

            <div className="flex border-t border-line pt-2.75">
                <button
                    type="button"
                    onClick={onAction}
                    className="relative z-10 flex cursor-pointer items-center gap-1 text-[14px] font-medium text-accent transition-opacity hover:opacity-80"
                >
                    <Icon src="/plus.svg" box="size-[13px]" />
                    {actionLabel}
                </button>
            </div>
        </div>
    )
}
