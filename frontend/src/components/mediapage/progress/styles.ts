export const SECONDARY_BUTTON = "flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-[14px] text-ink transition-colors hover:border-accent hover:text-accent"
export const PRIMARY_BUTTON = "flex cursor-pointer items-center gap-2 rounded-md border border-accent bg-accent px-3 py-2 text-[14px] font-semibold text-bg transition-opacity hover:opacity-90"

export function formatMinutes(minutes: number) {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    if (h === 0) return `${m}m`
    return m > 0 ? `${h}h ${m}m` : `${h}h`
}
