import type {ReactNode} from "react";

type TooltipProps = {
    label: string
    children: ReactNode
    // Which side of the trigger the tooltip appears on
    side?: 'top' | 'bottom'
    // Horizontal alignment; use 'end' near the right edge of the page so it doesn't overflow
    align?: 'center' | 'end'
    // Extra classes for the wrapper, e.g. absolute positioning
    className?: string
}

const SIDE = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
}

const ALIGN = {
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
}

// Shows after a short hover delay, or straight away for keyboard focus.
// The label is aria-hidden because the trigger already carries an aria-label.
export default function Tooltip({ label, children, side = 'top', align = 'center', className = 'relative' }: TooltipProps) {
    return (
        <span className={`group/tip inline-flex ${className}`}>
            {children}
            <span
                aria-hidden="true"
                className={`pointer-events-none absolute z-20 rounded bg-surface-raised px-2 py-1 text-[13px] whitespace-nowrap text-ink opacity-0 shadow-lg ring-1 ring-line transition-opacity duration-150 group-hover/tip:opacity-100 group-hover/tip:delay-700 group-has-focus-visible/tip:opacity-100 ${SIDE[side]} ${ALIGN[align]}`}
            >
                {label}
            </span>
        </span>
    )
}
