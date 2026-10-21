import {api} from "../../api.ts";
import {providerUrl} from "./providers.ts";
import {PROGRESS_KIND, type EpisodeInfo, type MediaType, type Provider, type Season, type Title} from "./titles.ts";

// Shapes returned by the Spring backend (see MediaDetail.java and friends)
export type MediaDetail = {
    id: number
    kind: string
    title: string
    seriesId: number | null
    number: number | null
    status: string
    rating: number | null
    details: string | null
    subtitle: string | null
    originalTitle: string | null
    creator: string | null
    releaseYear: number | null
    endYear: number | null
    format: string | null
    ageRating: string | null
    synopsis: string | null
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
    revisits: number
    tags: string[]
    links: Record<string, string>
    providerRatings: { provider: Provider, score: number, scale: 10 | 100, votes: number, fetchedAt: string }[]
    milestones: { label: string, done: boolean }[]
    lockedFields: string[]
    siblings: { id: number, kind: string, title: string, number: number | null, creator: string | null, cover: string | null }[]
}

export type EpisodeDto = {
    id: number
    number: number
    season: number | null
    seasonNumber: number | null
    title: string | null
    airDate: string | null
    minutes: number | null
    views: number
    rating: number | null
    headline: string | null
    summary: string | null
    recap: string | null
    watchedOn: string | null
    favorite: boolean
    communityScore: number | null
    communityVotes: number | null
    lockedFields: string[]
    screenshots: { id: number, path: string, caption: string | null }[]
}

export type JournalDto = { id: number, episodeId: number | null, quote: string, reflection: string | null, writtenOn: string }

export const KIND_TO_TYPE: Record<string, MediaType> = {
    anime: "Anime", tv: "TV", movie: "Movie", book: "Book",
    "light-novel": "Light novel", manga: "Manga", audiobook: "Audiobook", game: "Game",
}
export const TYPE_TO_KIND = Object.fromEntries(Object.entries(KIND_TO_TYPE).map(([k, v]) => [v, k])) as Record<MediaType, string>

// What progress is counted in when the title doesn't say
const DEFAULT_UNIT: Record<string, string> = {
    anime: "episodes", tv: "episodes", movie: "minutes", book: "pages",
    "light-novel": "volumes", manga: "volumes", audiobook: "minutes", game: "percent",
}

function unitLabel(kind: string, unit: string) {
    if (unit === "percent") return "% complete"
    if (unit === "minutes") return kind === "audiobook" ? "minutes listened" : "minutes watched"
    if (unit === "episodes") return "episodes watched"
    return `${unit} read`
}

// Backend statuses -> the labels the page shows
export const STATUS_LABELS: Record<string, string> = {
    want: "For later", finished: "Completed", paused: "Paused", dropped: "Dropped",
}

export const ACTIVE_LABELS = ["Watching", "Reading", "Listening", "Playing"]

export function statusValue(label: string) {
    if (ACTIVE_LABELS.includes(label)) return "in-progress"
    return Object.entries(STATUS_LABELS).find(([, l]) => l === label)?.[0] ?? "want"
}

// details is free-form JSON: a list of {label, value}, or an object like {"pages": 192}
function parseDetails(json: string | null): Title["details"] {
    if (!json) return []
    try {
        const data = JSON.parse(json)
        if (Array.isArray(data)) return data.filter((d) => d?.label && d?.value != null).map((d) => ({ label: String(d.label), value: String(d.value) }))
        return Object.entries(data).map(([k, v]) => ({ label: k[0].toUpperCase() + k.slice(1), value: String(v) }))
    } catch {
        return []
    }
}

// Placeholder for titles without a cover yet
export const NO_COVER = "/covers/placeholder.svg"

export function toTitle(m: MediaDetail, episodes: EpisodeDto[], journal: JournalDto[]): Title {
    const type = KIND_TO_TYPE[m.kind]
    const unit = m.progressUnit ?? DEFAULT_UNIT[m.kind]
    const kind = PROGRESS_KIND[type]
    const active = { episodes: "Watching", runtime: "Watching", pages: "Reading", listening: "Listening", playtime: "Playing" }[kind]
    const titleNote = journal.find((j) => j.episodeId === null)

    // TV episodes say which season they're in; anime seasons are separate titles
    const seasoned = episodes.some((e) => e.season !== null)
    let seasons: Season[] | undefined
    if (seasoned) {
        const bySeason = new Map<number, EpisodeDto[]>()
        for (const e of episodes) bySeason.set(e.season ?? 1, [...(bySeason.get(e.season ?? 1) ?? []), e])
        seasons = [...bySeason.entries()].sort(([a], [b]) => a - b).map(([number, eps]) => ({
            number,
            episodes: eps.map((e) => ({ title: e.title ?? `Episode ${e.seasonNumber ?? e.number}`, minutes: e.minutes ?? m.unitMinutes ?? undefined, aired: e.airDate ?? undefined })),
        }))
    }

    const episodeInfo: Record<number, EpisodeInfo> = {}
    for (const e of episodes) {
        const note = journal.find((j) => j.episodeId === e.id)
        episodeInfo[e.number] = {
            headline: e.headline ?? undefined,
            summary: e.summary ?? undefined,
            recap: e.recap ?? undefined,
            rating: e.communityScore ?? undefined,
            ratingCount: e.communityVotes ?? undefined,
            watchedOn: e.watchedOn ?? undefined,
            yourRating: e.rating ?? undefined,
            rewatches: Math.max(0, e.views - 1),
            favorite: e.favorite,
            note: note && { id: note.id, quote: note.quote, reflection: note.reflection ?? undefined, date: note.writtenOn },
            episodeId: e.id,
            lockedFields: e.lockedFields,
            screenshots: e.screenshots.map((s) => ({ id: s.id, src: s.path, caption: s.caption ?? "" })),
        }
    }

    const siblings = m.kind === "anime" && m.siblings.length > 0
        ? [{ id: m.id, number: m.number }, ...m.siblings].sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
        : null

    return {
        id: m.id,
        type,
        title: m.title,
        subtitle: m.subtitle ?? undefined,
        creator: m.creator ?? "",
        year: m.releaseYear ?? undefined,
        yearRange: m.releaseYear && m.endYear && m.endYear !== m.releaseYear ? `${m.releaseYear}–${m.endYear}` : undefined,
        format: m.format ?? undefined,
        ageRating: m.ageRating ?? undefined,
        originalTitle: m.originalTitle ?? undefined,
        cover: m.cover ?? NO_COVER,
        backdrop: m.backdrop ?? undefined,
        backdropPosition: m.backdropPosition ?? undefined,
        status: m.status === "in-progress" ? active : STATUS_LABELS[m.status] ?? "For later",
        synopsis: m.synopsis ?? "",
        tags: m.tags,
        details: parseDetails(m.details),
        progress: m.progress,
        // Seasoned shows count every episode they know about
        total: m.total ?? (seasoned ? episodes.length : 0),
        unit: unitLabel(m.kind, unit),
        episodeMinutes: m.unitMinutes ?? undefined,
        episodeTitles: seasoned ? undefined : Object.fromEntries(episodes.filter((e) => e.title).map((e) => [e.number, e.title!])),
        episodeAired: seasoned ? undefined : Object.fromEntries(episodes.filter((e) => e.airDate).map((e) => [e.number, e.airDate!])),
        seasons,
        franchise: siblings?.map((s, i) => ({ id: s.id, label: s.number ? `Season ${s.number}` : `Part ${i + 1}` })),
        episodeInfo,
        hoursPlayed: m.hoursPlayed ?? undefined,
        milestones: m.milestones,
        started: m.startedOn ?? undefined,
        lastActivity: m.lastActivityOn ?? undefined,
        rewatches: m.revisits,
        yourRating: m.rating ?? undefined,
        links: m.links,
        lockedFields: m.lockedFields,
        ratings: m.providerRatings.map((r) => ({
            provider: r.provider, score: r.score, scale: r.scale, count: r.votes,
            url: providerUrl(r.provider, type, m.links[r.provider] ?? "") ?? "",
        })),
        note: titleNote && { id: titleNote.id, quote: titleNote.quote, reflection: titleNote.reflection ?? undefined, source: "In your journal", date: titleNote.writtenOn },
        related: m.siblings.map((s) => ({ id: s.id, type: KIND_TO_TYPE[s.kind], title: s.title, creator: s.creator ?? undefined, cover: s.cover ?? NO_COVER })),
    }
}

export async function loadTitle(id: number) {
    const { data: media } = await api.get<MediaDetail>(`/media/${id}`)
    const episodic = media.kind === "anime" || media.kind === "tv"
    const [episodes, journal] = await Promise.all([
        episodic ? api.get<EpisodeDto[]>(`/media/${id}/episodes`).then((r) => r.data) : Promise.resolve([]),
        api.get<JournalDto[]>(`/media/${id}/journal`).then((r) => r.data),
    ])
    return { media, title: toTitle(media, episodes, journal) }
}

// The edit dialog works on a Title; the backend takes a full MediaRequest
export function toRequest(t: Title, m: MediaDetail, change: { status?: string, rating?: number | null } = {}) {
    const end = t.yearRange?.match(/\d{4}\D+(\d{4})/)?.[1]
    return {
        kind: TYPE_TO_KIND[t.type],
        title: t.title,
        seriesId: m.seriesId,
        number: m.number,
        status: change.status ?? m.status,
        rating: change.rating !== undefined ? change.rating : m.rating,
        details: JSON.stringify(t.details),
        subtitle: t.subtitle ?? null,
        originalTitle: t.originalTitle ?? null,
        creator: t.creator || null,
        releaseYear: t.year ?? null,
        endYear: end ? Number(end) : null,
        format: t.format ?? null,
        ageRating: t.ageRating ?? null,
        synopsis: t.synopsis || null,
        cover: t.cover === NO_COVER ? null : t.cover,
        backdrop: t.backdrop ?? null,
        backdropPosition: t.backdropPosition ?? null,
        total: t.total || null,
        progressUnit: m.progressUnit,
        unitMinutes: t.episodeMinutes ?? null,
        tags: t.tags,
        lockedFields: t.lockedFields ?? [],
    }
}

export type RefreshResult = { media: MediaDetail, problems: Record<string, string> }

// A value a source would put in a field; cover and backdrop values are provider image addresses
export type Suggestion = { field: string, current: unknown, value: unknown, provider: Provider }
export type SuggestResult = { media: MediaDetail, suggestions: Suggestion[], problems: Record<string, string> }
