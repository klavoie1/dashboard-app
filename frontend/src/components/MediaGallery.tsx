import {useEffect, useState} from "react";
import {api} from "../api.ts";
import Gallery, {type GalleryImage} from "./Gallery.tsx";
import type {ImageOption} from "./ImageChoices.tsx";

// The gallery for a title or a character, wired to the API
export default function MediaGallery({ owner, id, heading, hint }: {
    owner: "media" | "characters"
    id: number
    heading: string
    hint: string
}) {
    const [images, setImages] = useState<GalleryImage[] | null>(null)
    const base = `/${owner}/${id}/images`

    useEffect(() => { void api.get<GalleryImage[]>(base).then((r) => setImages(r.data)).catch(() => setImages([])) }, [base])

    async function upload(file: File, caption: string) {
        const form = new FormData()
        form.append("file", file)
        if (caption) form.append("caption", caption)
        setImages((await api.post<GalleryImage[]>(base, form)).data)
    }

    // Titles can pull artwork and screenshots from their sources (TMDb backdrops, IGDB screenshots…)
    const loadOptions = owner === "media"
        ? async () => (await api.get<{ options: ImageOption[] }>(`/media/${id}/artwork-options`, { params: { slot: "backdrop" } })).data.options
        : undefined

    return (
        <Gallery
            heading={heading}
            hint={hint}
            images={images}
            onUpload={upload}
            onRemove={async (imageId) => {
                await api.delete(`/images/${imageId}`)
                setImages((list) => list?.filter((x) => x.id !== imageId) ?? null)
            }}
            onCaption={async (imageId, caption) => {
                const { data } = await api.patch<GalleryImage>(`/images/${imageId}`, { caption })
                setImages((list) => list?.map((x) => (x.id === imageId ? data : x)) ?? null)
            }}
            loadOptions={loadOptions}
            onChooseOption={loadOptions && (async (o, caption) => {
                setImages((await api.post<GalleryImage[]>(`${base}/from-url`, { url: o.url, caption: caption || o.label })).data)
            })}
        />
    )
}
