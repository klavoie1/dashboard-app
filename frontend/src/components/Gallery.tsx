import {type FormEvent, useEffect, useRef, useState} from "react";
import Icon from "./Icon.tsx";
import ImageChoices, {type ImageOption} from "./ImageChoices.tsx";

export type GalleryImage = { id: number, path: string, caption: string | null }

// A gallery of your own images: upload several at once, pick from sources, caption, view full size, remove.
// The page passes the API calls, so the same gallery serves titles and characters.
export default function Gallery({ heading, hint, images, onUpload, onRemove, onCaption, loadOptions, onChooseOption }: {
    heading: string
    hint: string
    images: GalleryImage[] | null
    onUpload: (file: File, caption: string) => Promise<void>
    onRemove: (id: number) => Promise<void>
    onCaption: (id: number, caption: string) => Promise<void>
    // Images the linked sources offer, with sizes; leave out where sources have none
    loadOptions?: () => Promise<ImageOption[]>
    onChooseOption?: (option: ImageOption, caption: string) => Promise<void>
}) {
    const [adding, setAdding] = useState(false)
    const [caption, setCaption] = useState("")
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [options, setOptions] = useState<ImageOption[] | null | "loading">(null)
    const [viewing, setViewing] = useState<GalleryImage | null>(null)
    const [editingCaption, setEditingCaption] = useState("")
    const viewer = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        if (viewing && !viewer.current?.open) viewer.current?.showModal()
    }, [viewing])

    async function run(action: () => Promise<void>, failure: string) {
        setBusy(true)
        setError(null)
        try {
            await action()
            return true
        } catch {
            setError(failure)
            return false
        } finally {
            setBusy(false)
        }
    }

    async function upload(files: FileList | null) {
        if (!files?.length) return
        const ok = await run(async () => {
            // One caption for the batch; each file is stored separately
            for (const file of Array.from(files)) await onUpload(file, caption)
        }, "Couldn’t upload every image. Use JPG, PNG, WebP or GIF files under 15 MB.")
        if (ok) setCaption("")
    }

    async function showOptions() {
        if (!loadOptions) return
        setOptions("loading")
        try {
            setOptions(await loadOptions())
        } catch {
            setOptions(null)
            setError("Couldn’t load images from your sources.")
        }
    }

    async function choose(o: ImageOption) {
        if (!onChooseOption) return
        const ok = await run(() => onChooseOption(o, caption), "Couldn’t download that image.")
        if (ok && options !== "loading") setOptions((list) => (Array.isArray(list) ? list.filter((x) => x.url !== o.url) : list))
    }

    function saveCaption(e: FormEvent) {
        e.preventDefault()
        if (!viewing) return
        void run(() => onCaption(viewing.id, editingCaption), "Couldn’t save the caption.").then((ok) => ok && viewer.current?.close())
    }

    const list = images ?? []
    return (
        <section id="gallery" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="m-0 font-serif text-3xl font-normal text-ink">{heading}</h2>
                <div className="flex items-center gap-4">
                    {list.length > 0 && <p className="m-0 text-[14px] text-ink-muted">{list.length} {list.length === 1 ? "image" : "images"}</p>}
                    <button type="button" onClick={() => setAdding((v) => !v)} aria-expanded={adding} className="flex cursor-pointer items-center gap-1.5 text-[15px] text-accent hover:opacity-80">
                        <Icon src="/plus.svg" box="size-3.5" />
                        Add images
                    </button>
                </div>
            </div>
            <p className="m-0 text-[14px] text-ink-muted">{hint}</p>

            {adding && (
                <div className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
                    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted">
                        Caption (optional, used for every image you add next)
                        <input value={caption} onChange={(e) => setCaption(e.target.value)} className="rounded-md border border-line bg-bg px-3 py-2 text-[15px] text-ink focus:border-accent focus:outline-none" />
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-accent bg-accent px-3.5 py-2 text-[14px] font-semibold text-bg hover:opacity-90">
                            <Icon src="/plus.svg" box="size-3.5" />
                            Upload from this device
                            <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={(e) => { void upload(e.target.files); e.target.value = "" }} className="sr-only" />
                        </label>
                        {loadOptions && (
                            <button type="button" onClick={() => void showOptions()} className="cursor-pointer rounded-md border border-line px-3.5 py-2 text-[14px] text-ink hover:border-accent hover:text-accent">
                                Choose from your sources
                            </button>
                        )}
                        {busy && <p role="status" className="m-0 text-[14px] text-ink-muted">Saving…</p>}
                    </div>
                    {options === "loading" && <p role="status" className="m-0 text-[14px] text-ink-muted">Looking up images and their sizes…</p>}
                    {Array.isArray(options) && <ImageChoices options={options} wide busy={busy} onChoose={(o) => void choose(o)} />}
                </div>
            )}
            {error && <p role="alert" className="m-0 text-[14px] text-ink">{error}</p>}

            {images !== null && list.length === 0 && !adding && (
                <p className="m-0 text-base text-ink-muted">No images yet.</p>
            )}
            {list.length > 0 && (
                <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
                    {list.map((img) => (
                        <li key={img.id}>
                            <button
                                type="button"
                                onClick={() => { setEditingCaption(img.caption ?? ""); setViewing(img) }}
                                aria-label={`View ${img.caption ?? "image"}`}
                                className="group relative block w-full cursor-pointer overflow-hidden rounded-md"
                            >
                                <img src={img.path} alt={img.caption ?? ""} loading="lazy" className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]" />
                                {img.caption && (
                                    <span className="absolute inset-x-0 bottom-0 truncate bg-linear-to-b from-transparent to-bg/85 px-3 pt-5 pb-2 text-left text-[13px] text-ink">{img.caption}</span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <dialog
                ref={viewer}
                onClose={() => setViewing(null)}
                aria-label="Image"
                className="m-auto max-w-[min(72rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface p-0 text-ink [color-scheme:dark] backdrop:bg-black/80"
            >
                {viewing && (
                    <figure className="m-0">
                        <img src={viewing.path} alt={viewing.caption ?? ""} className="block max-h-[75vh] w-full object-contain" />
                        <form onSubmit={saveCaption} className="flex flex-wrap items-center gap-3 px-4 py-3">
                            <label className="flex min-w-48 flex-1 items-center gap-2 text-[14px] text-ink-muted">
                                <span className="sr-only">Caption</span>
                                <input value={editingCaption} onChange={(e) => setEditingCaption(e.target.value)} placeholder="Add a caption" className="flex-1 rounded-md border border-line bg-bg px-3 py-1.5 text-[15px] text-ink focus:border-accent focus:outline-none" />
                            </label>
                            <button type="submit" disabled={busy} className="cursor-pointer text-[14px] font-semibold text-accent hover:opacity-80">Save caption</button>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => void run(() => onRemove(viewing.id), "Couldn’t remove that image.").then((ok) => ok && viewer.current?.close())}
                                className="cursor-pointer text-[14px] text-ink-muted hover:text-ink"
                            >
                                Remove
                            </button>
                            <button type="button" onClick={() => viewer.current?.close()} className="cursor-pointer text-[14px] text-ink-soft hover:text-ink">Close</button>
                        </form>
                    </figure>
                )}
            </dialog>
        </section>
    )
}
