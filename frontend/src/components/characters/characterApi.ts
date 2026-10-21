import {api} from "../../api.ts";
import {KIND_TO_TYPE} from "../mediapage/titleApi.ts";
import type {Provider} from "../mediapage/titles.ts";

// A character's part in one title (AppearanceView.java)
export type Appearance = {
    characterId: number
    mediaId: number
    mediaTitle: string
    mediaKind: string
    mediaCover: string | null
    role: string | null
    actor: string | null
    actorLanguage: string | null
    position: number | null
}

// CharacterResponse.java
export type Character = {
    id: number
    name: string
    nativeName: string | null
    role: string | null
    portrait: string | null
    about: string | null
    details: string | null
    favorite: boolean
    franchiseIds: number[]
    mediaIds: number[]
    lockedFields: string[]
    links: Partial<Record<Provider, string>>
    appearances: Appearance[]
}

export type CastResult = { cast: Character[], source: Provider | null, problems: Record<string, string> }

// Sources that know about characters, in the order the edit dialog shows them
export const CHARACTER_PROVIDERS: Provider[] = ["anilist", "myanimelist", "tmdb", "tvmaze", "igdb"]

export const NO_PORTRAIT = "/covers/placeholder.svg"
export const portraitOf = (c: { portrait: string | null }) => c.portrait ?? NO_PORTRAIT

// "MAIN" -> "Main"
export function partLabel(role: string | null) {
    if (!role) return null
    return role.charAt(0) + role.slice(1).toLowerCase()
}

// The appearance on a given title, or the most important one
export function appearanceIn(c: Character, mediaId?: number) {
    return c.appearances.find((a) => a.mediaId === mediaId)
        ?? [...c.appearances].sort((a, b) => (a.role === "MAIN" ? 0 : 1) - (b.role === "MAIN" ? 0 : 1))[0]
}

// "ANIME · MANGA" style list of the kinds of title a character appears in
export function kindsOf(c: Character) {
    return [...new Set(c.appearances.map((a) => KIND_TO_TYPE[a.mediaKind] ?? a.mediaKind))].join(" · ")
}

export function actorLine(a: Appearance | undefined) {
    if (!a?.actor) return null
    const lang = a.actorLanguage === "Japanese" ? "JP" : a.actorLanguage === "English" ? "EN" : a.actorLanguage
    return lang ? `${a.actor} · ${lang}` : a.actor
}

export const loadCharacters = (mediaId?: number) =>
    api.get<Character[]>("/characters", { params: mediaId ? { mediaId } : {} }).then((r) => r.data)

export const fetchCast = (mediaId: number) => api.post<CastResult>(`/media/${mediaId}/characters/fetch`).then((r) => r.data)

export async function setFavorite(c: Character, favorite: boolean) {
    const { data } = await api.patch<Character>(`/characters/${c.id}/favorite`, { favorite })
    return data
}

export function parseDetails(json: string | null): { label: string, value: string }[] {
    if (!json) return []
    try {
        const data = JSON.parse(json)
        return Array.isArray(data) ? data.filter((d) => d?.label && d?.value != null).map((d) => ({ label: String(d.label), value: String(d.value) })) : []
    } catch {
        return []
    }
}
