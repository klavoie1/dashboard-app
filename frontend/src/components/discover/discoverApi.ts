import {api} from "../../api.ts";
import type {RefreshResult} from "../mediapage/titleApi.ts";
import type {Provider} from "../mediapage/titles.ts";

export type Hit = { provider: Provider, externalId: string, kind: string, title: string, year: number | null, detail: string | null, imageUrl: string | null }

// DiscoverService.Shelf
export type Shelf = { id: string, title: string, subtitle: string, seedId: number | null, items: { hit: Hit, mediaId: number | null }[] }
export type Discover = { shelves: Shelf[], problems: Record<string, string>, builtAt: string }

export const loadDiscover = (refresh = false) => api.get<Discover>("/media/discover", { params: { refresh } }).then((r) => r.data)

// Adds a suggestion to the library with its details, artwork and episodes; returns the new title's id
export async function addToLibrary(hit: Hit) {
    const { data } = await api.post<RefreshResult>("/media/import", {
        provider: hit.provider, externalId: hit.externalId, kind: hit.kind, title: hit.title,
    })
    return data.media.id
}
