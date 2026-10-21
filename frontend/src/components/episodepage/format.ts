import type {EpisodeRef, Title} from "../mediapage/titles.ts";

const pad = (n: number) => String(n).padStart(2, "0")

// Anime seasons come from the franchise list, since each season is its own title
export function seasonNumber(title: Title, ep: EpisodeRef) {
    if (ep.season) return ep.season
    const i = title.franchise?.findIndex((f) => f.id === title.id) ?? -1
    return i >= 0 ? i + 1 : undefined
}

// "SEASON 01 · EPISODE 06", or just the episode when there are no seasons
export function eyebrow(title: Title, ep: EpisodeRef) {
    const season = seasonNumber(title, ep)
    return `${season ? `Season ${pad(season)} · ` : ""}Episode ${pad(ep.number)}`
}

// "05 · Phantoms of the Dead", with the season in front for TV
export function shortName(ep: EpisodeRef) {
    return `${ep.season ? `S${ep.season} · ` : ""}${pad(ep.number)} · ${ep.title}`
}

export const longDate = (iso: string) =>
    new Date(`${iso}T00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
