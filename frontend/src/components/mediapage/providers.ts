import type {MediaType, Provider} from "./titles.ts";

// MAL and AniList file light novels under manga
const READ_TYPES: MediaType[] = ["Manga", "Light novel", "Book"]

// Pulls the id out of a pasted provider link, or keeps what was typed if it's already an id
export function parseProviderId(provider: Provider, input: string) {
    const value = input.trim()
    const patterns: Record<Provider, RegExp> = {
        myanimelist: /myanimelist\.net\/(?:anime|manga)\/(\d+)/,
        anilist: /anilist\.co\/(?:anime|manga)\/(\d+)/,
        mangabaka: /mangabaka\.dev\/(?:series\/)?([\w-]+)/,
        tmdb: /themoviedb\.org\/(?:movie|tv)\/(\d+)/,
        igdb: /igdb\.com\/games\/([\w-]+)/,
        tvmaze: /tvmaze\.com\/shows\/(\d+)/,
        openlibrary: /openlibrary\.org\/works\/(OL\d+W)/,
        kitsu: /kitsu\.(?:app|io)\/(?:anime|manga)\/([\w-]+)/,
        mangadex: /mangadex\.org\/title\/([0-9a-f-]{36})/,
        fanarttv: /$^/,
    }
    return value.match(patterns[provider])?.[1] ?? value
}

// Link back to the title on the provider's site, or null when the format isn't known
export function providerUrl(provider: Provider, type: MediaType, id: string) {
    if (!id) return null
    const section = READ_TYPES.includes(type) ? "manga" : "anime"
    switch (provider) {
        case "myanimelist": return `https://myanimelist.net/${section}/${id}`
        case "anilist": return `https://anilist.co/${section}/${id}`
        case "tmdb": return `https://www.themoviedb.org/${type === "Movie" ? "movie" : "tv"}/${id}`
        case "igdb": return `https://www.igdb.com/games/${id}`
        case "tvmaze": return `https://www.tvmaze.com/shows/${id}`
        case "openlibrary": return `https://openlibrary.org/works/${id}`
        case "kitsu": return `https://kitsu.app/${READ_TYPES.includes(type) ? "manga" : "anime"}/${id}`
        case "mangadex": return `https://mangadex.org/title/${id}`
        case "fanarttv": return null
        // MangaBaka's link format still needs checking against its docs
        case "mangabaka": return null
    }
}
