// How you move through a title; each one will get its own progress component
export type ProgressKind = "episodes" | "runtime" | "pages" | "listening" | "playtime"

export type MediaType = "Anime" | "TV" | "Movie" | "Book" | "Light novel" | "Manga" | "Audiobook" | "Game"

export const PROGRESS_KIND: Record<MediaType, ProgressKind> = {
    "Anime": "episodes",
    "TV": "episodes",
    "Movie": "runtime",
    "Book": "pages",
    "Light novel": "pages",
    "Manga": "pages",
    "Audiobook": "listening",
    "Game": "playtime",
}

// Where community ratings come from; fetched and cached by the backend later
export type Provider = "myanimelist" | "anilist" | "mangabaka" | "tmdb" | "igdb" | "tvmaze" | "openlibrary" | "kitsu" | "mangadex" | "fanarttv"

export const PROVIDER_NAMES: Record<Provider, string> = {
    myanimelist: "MyAnimeList",
    anilist: "AniList",
    mangabaka: "MangaBaka",
    tmdb: "TMDb",
    igdb: "IGDB",
    tvmaze: "TVmaze",
    openlibrary: "Open Library",
    kitsu: "Kitsu",
    mangadex: "MangaDex",
    fanarttv: "Fanart.tv",
}

// Self-hosted provider icons; a provider without one shows its name only
export const PROVIDER_LOGOS: Partial<Record<Provider, string>> = {
    myanimelist: "/provider-icons/myanimelist.svg",
    anilist: "/provider-icons/anilist.png",
    mangabaka: "/provider-icons/mangabaka.png",
    tmdb: "/provider-icons/tmdb.png",
    tvmaze: "/provider-icons/tvmaze.png",
    openlibrary: "/provider-icons/openlibrary.png",
    kitsu: "/provider-icons/kitsu.png",
    mangadex: "/provider-icons/mangadex.png",
    fanarttv: "/provider-icons/fanarttv.png",
}

export const RATING_PROVIDERS: Record<MediaType, Provider[]> = {
    "Anime": ["myanimelist", "anilist", "kitsu"],
    "TV": ["tmdb", "tvmaze"],
    "Movie": ["tmdb"],
    "Book": ["openlibrary"],
    "Light novel": ["myanimelist", "anilist", "kitsu"],
    "Manga": ["myanimelist", "anilist", "mangadex", "kitsu", "mangabaka"],
    "Audiobook": [],
    "Game": ["igdb"],
}

export type ProviderRating = {
    provider: Provider
    score: number
    // Shown in the provider's own scale, never averaged together
    scale: 10 | 100
    count: number
    url: string
}

// Shelf ids used by /library?category=…
export const CATEGORY_IDS: Record<MediaType, string> = {
    "Anime": "anime",
    "TV": "tv",
    "Movie": "movies",
    "Book": "books",
    "Light novel": "light-novels",
    "Manga": "manga",
    "Audiobook": "audiobooks",
    "Game": "games",
}

export type Season = {
    number: number
    // Weekly air dates start here
    firstAired?: string
    episodes: { title: string, minutes?: number, aired?: string }[]
}

export type EpisodeInfo = {
    // Short editorial line shown as the section heading
    headline?: string
    summary?: string
    // Full recap, hidden behind a spoiler toggle
    recap?: string
    screenshots?: { id?: number, src: string, caption: string }[]
    lockedFields?: string[]
    // Community score for this one episode, out of 10
    rating?: number
    ratingCount?: number
    // Share of ratings in 9–10, 7–8 and 1–6, as percentages
    distribution?: [number, number, number]
    // Your own tracking
    watchedOn?: string
    yourRating?: number
    rewatches?: number
    favorite?: boolean
    note?: { id?: number, quote: string, reflection?: string, date: string }
    // The episode's id on the server, needed to tie notes to it
    episodeId?: number
}

export type RelatedTitle = { id: number, type: MediaType, title: string, creator?: string, cover: string }

export type Title = {
    id: number
    type: MediaType
    title: string
    subtitle?: string
    creator: string
    year?: number
    // e.g. "2023–2024" when it ran for longer than a year
    yearRange?: string
    format?: string
    ageRating?: string
    originalTitle?: string
    cover: string
    // Wide artwork for the hero; falls back to a blurred cover
    backdrop?: string
    backdropPosition?: string
    status: string
    synopsis: string
    tags: string[]
    // Type-specific facts, shown as-is in the details list
    details: { label: string, value: string }[]
    progress: number
    total: number
    unit: string
    // Kind-specific tracking extras; all optional so providers can fill what they have
    episodeMinutes?: number
    episodeTitles?: Record<number, string>
    // Real air dates when known; otherwise they are counted weekly from firstAired
    episodeAired?: Record<number, string>
    // TV shows keep their seasons together; total and progress count across all of them
    seasons?: Season[]
    // Anime lists each season as its own entry (like AniList and MAL), linked here in order
    franchise?: { id: number, label: string }[]
    // Per-episode extras, keyed by the episode's number across the whole show
    episodeInfo?: Record<number, EpisodeInfo>
    hoursPlayed?: number
    milestones?: { label: string, done: boolean }[]
    // Episodes are dated weekly from this ISO date
    firstAired?: string
    // Your own tracking
    started?: string
    lastActivity?: string
    rewatches?: number
    yourRating?: number
    note?: { id?: number, quote: string, reflection?: string, source: string, date: string }
    ratings?: ProviderRating[]
    // This title's id on each provider, so metadata and ratings can be matched without guessing by name
    links?: Partial<Record<Provider, string>>
    // Fields fetching must leave alone (backend names, e.g. "synopsis", "cover")
    lockedFields?: string[]
    // Other entries in the same series, e.g. a manga's other volumes
    related: RelatedTitle[]
}

// Where a show-wide episode count lands: which season, and which episode within it
export function locateEpisode(seasons: Season[], overall: number) {
    let offset = 0
    for (const season of seasons) {
        if (overall <= offset + season.episodes.length) return { season, episode: overall - offset, offset }
        offset += season.episodes.length
    }
    return null
}

// Episodes before this season starts
export function seasonOffset(seasons: Season[], number: number) {
    return seasons.filter((s) => s.number < number).reduce((sum, s) => sum + s.episodes.length, 0)
}

export type EpisodeRef = {
    // Position across the whole show, used in URLs and progress
    overall: number
    season?: number
    // Position within its season (same as overall without seasons)
    number: number
    title: string
    minutes?: number
    aired?: string
}

// Looks up one episode for both seasoned TV shows and single-entry anime
export function episodeAt(title: Title, overall: number): EpisodeRef | null {
    if (overall < 1 || overall > title.total) return null
    const weekly = (first: string | undefined, n: number) =>
        first ? new Date(new Date(`${first}T00:00`).getTime() + (n - 1) * 7 * 86_400_000).toISOString().slice(0, 10) : undefined

    if (title.seasons) {
        const spot = locateEpisode(title.seasons, overall)
        if (!spot) return null
        const ep = spot.season.episodes[spot.episode - 1]
        return { overall, season: spot.season.number, number: spot.episode, title: ep.title, minutes: ep.minutes, aired: ep.aired ?? weekly(spot.season.firstAired, spot.episode) }
    }
    return {
        overall,
        number: overall,
        title: title.episodeTitles?.[overall] ?? `Episode ${overall}`,
        minutes: title.episodeMinutes,
        aired: title.episodeAired?.[overall] ?? weekly(title.firstAired, overall),
    }
}

export const episodePath = (titleId: number, overall: number) => `/library/${titleId}/episodes/${overall}`
