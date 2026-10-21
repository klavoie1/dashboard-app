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
export type Provider = "myanimelist" | "anilist" | "mangabaka" | "tmdb" | "igdb"

export const PROVIDER_NAMES: Record<Provider, string> = {
    myanimelist: "MyAnimeList",
    anilist: "AniList",
    mangabaka: "MangaBaka",
    tmdb: "TMDb",
    igdb: "IGDB",
}

// Self-hosted provider icons; a provider without one shows its name only
export const PROVIDER_LOGOS: Partial<Record<Provider, string>> = {
    myanimelist: "/provider-icons/myanimelist.svg",
    anilist: "/provider-icons/anilist.png",
    tmdb: "/provider-icons/tmdb.png",
}

export const RATING_PROVIDERS: Record<MediaType, Provider[]> = {
    "Anime": ["myanimelist", "anilist"],
    "TV": ["tmdb"],
    "Movie": ["tmdb"],
    "Book": [],
    "Light novel": ["myanimelist", "anilist"],
    "Manga": ["myanimelist", "anilist", "mangabaka"],
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

export type Title = {
    id: number
    type: MediaType
    title: string
    subtitle?: string
    creator: string
    year: number
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
    note?: { quote: string, source: string, date: string }
    ratings?: ProviderRating[]
    related: number[]
}

// Placeholder titles until the detail endpoint exists in the backend
export const TITLES: Title[] = [
    {
        id: 1,
        type: "Anime",
        title: "Frieren",
        subtitle: "Beyond Journey’s End",
        creator: "Madhouse",
        year: 2023,
        cover: "/discover/frieren-manga.jpg",
        backdrop: "/featured/frieren.jpg",
        backdropPosition: "50% 25%",
        status: "Watching",
        synopsis: "After the demon king is defeated, the elf mage Frieren outlives her old party and sets out on a new journey to understand the people she once travelled with, and what it means to remember them.",
        tags: ["Fantasy", "Adventure", "Drama"],
        details: [
            { label: "Studio", value: "Madhouse" },
            { label: "Episodes", value: "28" },
            { label: "Aired", value: "Sep 2023 – Mar 2024" },
            { label: "Source", value: "Manga" },
        ],
        progress: 6,
        total: 28,
        unit: "episodes watched",
        note: { quote: "Courage isn’t the absence of fear. Stark is already my favorite.", source: "After episode 6", date: "2026-10-16" },
        ratings: [
            { provider: "myanimelist", score: 9.3, scale: 10, count: 412318, url: "https://myanimelist.net/anime/52991" },
            { provider: "anilist", score: 91, scale: 100, count: 168204, url: "https://anilist.co/anime/154587" },
        ],
        related: [101, 104],
    },
    {
        id: 7,
        type: "Book",
        title: "Piranesi",
        creator: "Susanna Clarke",
        year: 2020,
        cover: "/discover/piranesi.jpg",
        status: "Reading",
        synopsis: "Piranesi lives in the House, a world of endless halls lined with statues and washed by an imprisoned sea. He keeps careful journals of everything he finds, until signs of another person begin to appear.",
        tags: ["Fantasy", "Mystery"],
        details: [
            { label: "Author", value: "Susanna Clarke" },
            { label: "Publisher", value: "Bloomsbury" },
            { label: "Pages", value: "272" },
        ],
        progress: 88,
        total: 272,
        unit: "pages read",
        related: [102, 105],
    },
    {
        id: 103,
        type: "Game",
        title: "Spiritfarer",
        creator: "Thunder Lotus",
        year: 2020,
        cover: "/discover/spiritfarer.jpg",
        status: "Playing",
        synopsis: "Build a boat to explore the world, then befriend and care for spirits before finally releasing them into the afterlife.",
        tags: ["Management", "Cozy", "Narrative"],
        details: [
            { label: "Developer", value: "Thunder Lotus" },
            { label: "Platforms", value: "PC, Switch, PS4, Xbox" },
            { label: "Played", value: "21 hours" },
        ],
        progress: 42,
        total: 100,
        unit: "% complete",
        related: [104],
    },
    {
        id: 101,
        type: "Manga",
        title: "Frieren: Beyond Journey's End",
        creator: "Kanehito Yamada · Tsukasa Abe",
        year: 2020,
        cover: "/discover/frieren-manga.jpg",
        status: "For later",
        synopsis: "The manga behind the anime: an elf mage revisits the road she once travelled with the hero's party.",
        tags: ["Fantasy", "Adventure"],
        details: [
            { label: "Author", value: "Kanehito Yamada" },
            { label: "Artist", value: "Tsukasa Abe" },
            { label: "Volumes", value: "13" },
        ],
        progress: 0,
        total: 13,
        unit: "volumes read",
        ratings: [
            { provider: "myanimelist", score: 9.1, scale: 10, count: 38412, url: "https://myanimelist.net/manga/126287" },
            { provider: "anilist", score: 89, scale: 100, count: 21530, url: "https://anilist.co/manga/118586" },
            { provider: "mangabaka", score: 8.9, scale: 10, count: 1204, url: "https://mangabaka.dev" },
        ],
        related: [1],
    },
    {
        id: 102,
        type: "Book",
        title: "A Wizard of Earthsea",
        creator: "Ursula K. Le Guin",
        year: 1968,
        cover: "/discover/wizard-of-earthsea.jpg",
        status: "Not in library",
        synopsis: "A gifted, proud young wizard unleashes a shadow upon the world and must chase it across the islands of Earthsea.",
        tags: ["Fantasy", "Classic"],
        details: [{ label: "Author", value: "Ursula K. Le Guin" }, { label: "Pages", value: "183" }],
        progress: 0,
        total: 183,
        unit: "pages read",
        related: [7],
    },
    {
        id: 104,
        type: "Movie",
        title: "The Boy and the Heron",
        creator: "Hayao Miyazaki",
        year: 2023,
        cover: "/discover/boy-and-the-heron.jpg",
        status: "Not in library",
        synopsis: "Grieving his mother, a boy follows a mysterious talking heron into a world shared by the living and the dead.",
        tags: ["Animation", "Fantasy"],
        details: [{ label: "Director", value: "Hayao Miyazaki" }, { label: "Studio", value: "Studio Ghibli" }, { label: "Runtime", value: "2h 4m" }],
        progress: 0,
        total: 124,
        unit: "minutes watched",
        related: [1],
    },
    {
        id: 105,
        type: "Audiobook",
        title: "Piranesi",
        creator: "Susanna Clarke",
        year: 2020,
        cover: "/discover/piranesi.jpg",
        status: "Not in library",
        synopsis: "The same strange House, read aloud.",
        tags: ["Fantasy", "Mystery"],
        details: [{ label: "Author", value: "Susanna Clarke" }, { label: "Narrator", value: "Chiwetel Ejiofor" }, { label: "Length", value: "6h 41m" }],
        progress: 0,
        total: 401,
        unit: "minutes listened",
        related: [7],
    },
]

export function findTitle(id: number) {
    return TITLES.find((t) => t.id === id)
}
