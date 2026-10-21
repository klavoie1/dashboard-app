import {api} from "../../api.ts";
import {KIND_TO_TYPE, NO_COVER} from "../mediapage/titleApi.ts";
import {formatMinutes} from "../mediapage/progress/styles.ts";

// One library title as GET /api/media lists it (MediaResponse.java)
export type MediaSummary = {
    id: number
    kind: string
    title: string
    status: string
    rating: number | null
    subtitle: string | null
    creator: string | null
    releaseYear: number | null
    endYear: number | null
    format: string | null
    cover: string | null
    backdrop: string | null
    backdropPosition: string | null
    progress: number
    total: number | null
    progressUnit: string | null
    unitMinutes: number | null
    hoursPlayed: number | null
    startedOn: string | null
    lastActivityOn: string | null
    finishedOn: string | null
}

export const loadLibrary = () => api.get<MediaSummary[]>("/media").then((r) => r.data)

// Shelf ids in URLs (/library?category=…) and the kinds they hold
export const CATEGORIES = [
    { id: "movies", kind: "movie", label: "Films", icon: "/navbar-icons/category-movies.svg" },
    { id: "tv", kind: "tv", label: "TV shows", icon: "/navbar-icons/category-tv.svg" },
    { id: "anime", kind: "anime", label: "Anime", icon: "/navbar-icons/category-anime.svg" },
    { id: "books", kind: "book", label: "Books", icon: "/navbar-icons/category-books.svg" },
    { id: "manga", kind: "manga", label: "Manga", icon: "/navbar-icons/category-manga.svg" },
    { id: "games", kind: "game", label: "Games", icon: "/navbar-icons/category-games.svg" },
    { id: "audiobooks", kind: "audiobook", label: "Audiobooks", icon: "/navbar-icons/headphones.svg" },
    { id: "light-novels", kind: "light-novel", label: "Light novels", icon: "/navbar-icons/category-light-novel.svg" },
]

export const STATUSES = [
    { id: "in-progress", label: "In progress" },
    { id: "finished", label: "Completed" },
    { id: "want", label: "For later" },
    { id: "paused", label: "On hold" },
    { id: "dropped", label: "Dropped" },
]

export const typeOf = (m: MediaSummary) => KIND_TO_TYPE[m.kind] ?? m.kind
export const coverOf = (m: MediaSummary) => m.cover ?? NO_COVER

const DEFAULT_UNIT: Record<string, string> = {
    anime: "episodes", tv: "episodes", movie: "minutes", book: "pages",
    "light-novel": "volumes", manga: "volumes", audiobook: "minutes", game: "percent",
}
export const unitOf = (m: MediaSummary) => m.progressUnit ?? DEFAULT_UNIT[m.kind]

// What doing it looks like for this kind, e.g. "Watching"
export function activeVerb(m: MediaSummary) {
    if (m.kind === "game") return "Playing"
    if (m.kind === "audiobook") return "Listening"
    if (["anime", "tv", "movie"].includes(m.kind)) return "Watching"
    return "Reading"
}

export function statusLabel(m: MediaSummary) {
    if (m.status === "in-progress") return activeVerb(m)
    return STATUSES.find((s) => s.id === m.status)?.label ?? m.status
}

// "6 / 28 episodes", "1h 12m / 6h 41m", "42% complete"
export function progressText(m: MediaSummary) {
    const unit = unitOf(m)
    if (m.kind === "game") return `${m.hoursPlayed ?? 0}h played${m.progress ? ` · ${m.progress}%` : ""}`
    if (unit === "percent") return `${m.progress}% complete`
    if (unit === "minutes") return `${formatMinutes(m.progress)}${m.total ? ` / ${formatMinutes(m.total)}` : ""}`
    return `${m.progress}${m.total ? ` / ${m.total}` : ""} ${unit}`
}

export function percentOf(m: MediaSummary) {
    const max = unitOf(m) === "percent" ? 100 : m.total
    return max ? Math.min(100, Math.round((m.progress / max) * 100)) : 0
}

// The one-tap update shown on cards: how much it adds and what to call it
export function quickStep(m: MediaSummary): { label: string, progress: number, hours?: number } | null {
    const unit = unitOf(m)
    const atEnd = m.total !== null && m.progress >= m.total
    if (m.kind === "game") return { label: "Log a session (+1h)", progress: m.progress, hours: (m.hoursPlayed ?? 0) + 1 }
    if (atEnd) return null
    const cap = (n: number) => (m.total ? Math.min(m.total, n) : n)
    if (unit === "episodes") return { label: `Mark episode ${m.progress + 1} watched`, progress: m.progress + 1 }
    if (unit === "volumes") return { label: `Mark volume ${m.progress + 1} read`, progress: m.progress + 1 }
    if (unit === "chapters") return { label: `Mark chapter ${m.progress + 1} read`, progress: m.progress + 1 }
    if (unit === "pages") return { label: "Log 20 pages", progress: cap(m.progress + 20) }
    if (unit === "minutes") return m.kind === "movie"
        ? { label: "Mark watched", progress: m.total ?? m.progress }
        : { label: "Log 30 minutes", progress: cap(m.progress + 30) }
    return { label: "Log 10%", progress: Math.min(100, m.progress + 10) }
}

// Saves progress and returns the updated title
export async function logProgress(m: MediaSummary, progress: number, hours?: number) {
    const { data } = await api.patch<MediaSummary>(`/media/${m.id}/progress`, { progress, hoursPlayed: hours })
    return data
}

// "Today", "Oct 19", or "Oct 19, 2025" for other years
export function shortDay(iso: string | null) {
    if (!iso) return "—"
    const date = new Date(`${iso.slice(0, 10)}T00:00`)
    const today = new Date()
    if (date.toDateString() === today.toDateString()) return "Today"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" })
}

// "Updated today" / "Updated Oct 19" for card hints
export const updatedText = (iso: string | null) =>
    !iso ? "Not started yet" : shortDay(iso) === "Today" ? "Updated today" : `Updated ${shortDay(iso)}`

// Search thumbnails are loaded through the server, never from the provider directly
export const proxied = (url: string | null) => (url ? `/api/images?url=${encodeURIComponent(url)}` : NO_COVER)
