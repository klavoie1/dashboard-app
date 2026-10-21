import {locateEpisode, type ProgressKind, type Title} from "../titles.ts";
import {formatMinutes} from "./styles.ts";

// Manga and some light novels are tracked by volume instead of page
export function countsVolumes(title: Title) {
    return title.unit.startsWith("volume")
}

export const ACTIVE_STATUS: Record<ProgressKind, string> = {
    episodes: "Watching",
    runtime: "Watching",
    pages: "Reading",
    listening: "Listening",
    playtime: "Playing",
}

// Section tab label, e.g. "Episodes 28"
export function sectionLabel(kind: ProgressKind, title: Title) {
    if (kind === "episodes") return `Episodes  ${title.total}`
    if (kind === "pages") return countsVolumes(title) ? `Volumes  ${title.total}` : "Reading"
    if (kind === "listening") return "Listening"
    if (kind === "playtime") return "Playtime"
    return "Viewing"
}

// Short summary for the hero, e.g. "28 episodes"
export function lengthLabel(kind: ProgressKind, title: Title) {
    if (kind === "episodes") {
        const seasons = title.seasons?.length
        return seasons && seasons > 1 ? `${seasons} seasons  ·  ${title.total} episodes` : `${title.total} episodes`
    }
    if (kind === "pages") return countsVolumes(title) ? `${title.total} volumes` : `${title.total} pages`
    if (kind === "playtime") return null
    return formatMinutes(title.total)
}

export type Journey = {
    value: string
    of: string
    percent: number
    // Discrete units are drawn as one segment each when there aren't too many
    segments?: number
    filled?: number
    left?: string
    right?: string
    next?: string
    action?: { label: string, onClick?: () => void, href?: string }
}

type Tracking = {
    progress: number
    setProgress: (n: number) => void
    hours: number
    setHours: (n: number) => void
}

const pct = (value: number, max: number) => (max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0)
const pad = (n: number) => String(n).padStart(2, "0")

export function journeyFor(kind: ProgressKind, title: Title, t: Tracking): Journey {
    const { progress, total } = { progress: t.progress, total: title.total }
    const finished = progress >= total

    switch (kind) {
        case "episodes": {
            const next = progress + 1
            // Shows with seasons name the next episode as S2 · E03 and carry over between seasons
            const spot = title.seasons ? locateEpisode(title.seasons, next) : null
            if (title.seasons) {
                const minutes = title.seasons.flatMap((s) => s.episodes.map((e) => e.minutes ?? 0))
                const watchedMin = minutes.slice(0, progress).reduce((a, b) => a + b, 0)
                const leftMin = minutes.slice(progress).reduce((a, b) => a + b, 0)
                return {
                    value: String(progress),
                    of: `/ ${total} episodes`,
                    percent: pct(progress, total),
                    segments: total,
                    filled: progress,
                    left: watchedMin ? `${formatMinutes(watchedMin)} watched` : undefined,
                    right: leftMin ? `${formatMinutes(leftMin)} to go` : undefined,
                    next: spot ? `S${spot.season.number} · E${pad(spot.episode)} · ${spot.season.episodes[spot.episode - 1].title}` : undefined,
                    action: spot ? { label: `Mark S${spot.season.number}E${spot.episode} watched`, onClick: () => t.setProgress(next) } : undefined,
                }
            }
            const min = title.episodeMinutes
            return {
                value: String(progress),
                of: `/ ${total} episodes`,
                percent: pct(progress, total),
                segments: total,
                filled: progress,
                left: min ? `${formatMinutes(progress * min)} watched` : undefined,
                right: min && !finished ? `${formatMinutes((total - progress) * min)} to go` : undefined,
                next: finished ? undefined : `${pad(next)}${title.episodeTitles?.[next] ? ` · ${title.episodeTitles[next]}` : ""}`,
                action: finished ? undefined : { label: `Mark episode ${next} watched`, onClick: () => t.setProgress(next) },
            }
        }
        case "pages": {
            if (countsVolumes(title)) {
                const next = progress + 1
                return {
                    value: String(progress),
                    of: `/ ${total} volumes`,
                    percent: pct(progress, total),
                    segments: total,
                    filled: progress,
                    right: finished ? undefined : `${total - progress} to go`,
                    next: finished ? undefined : `Volume ${next}`,
                    action: finished ? undefined : { label: `Mark volume ${next} read`, onClick: () => t.setProgress(next) },
                }
            }
            return {
                value: String(progress),
                of: `/ ${total} pages`,
                percent: pct(progress, total),
                right: finished ? undefined : `${total - progress} pages to go`,
                next: finished ? undefined : `Pick up at page ${progress + 1}`,
                action: finished ? undefined : { label: "Log pages", href: "#progress" },
            }
        }
        case "listening":
            return {
                value: formatMinutes(progress),
                of: `/ ${formatMinutes(total)}`,
                percent: pct(progress, total),
                right: finished ? undefined : `${formatMinutes(total - progress)} to go`,
                next: finished ? undefined : "Keep listening",
                action: finished ? undefined : { label: "Log 30 minutes", onClick: () => t.setProgress(Math.min(total, progress + 30)) },
            }
        case "playtime":
            return {
                value: String(t.hours),
                of: "hours played",
                percent: pct(progress, total),
                left: `${pct(progress, total)}% complete`,
                next: "Your next session",
                action: { label: "Log a session (+1h)", onClick: () => t.setHours(t.hours + 1) },
            }
        case "runtime":
            return {
                value: finished ? "Watched" : formatMinutes(progress),
                of: finished ? "" : `/ ${formatMinutes(total)}`,
                percent: pct(progress, total),
                right: finished || progress === 0 ? undefined : `${formatMinutes(total - progress)} to go`,
                next: finished ? undefined : progress > 0 ? "Finish the film" : "Ready when you are",
                action: finished ? undefined : { label: "Mark watched", onClick: () => t.setProgress(total) },
            }
    }
}
