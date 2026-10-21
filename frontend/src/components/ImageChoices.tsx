import {PROVIDER_LOGOS, PROVIDER_NAMES, type Provider} from "./mediapage/titles.ts";

export type ImageOption = { provider: Provider, url: string, width: number | null, height: number | null, label: string | null }

// "1920 × 1080 · 16:9"; images whose size couldn't be read say so
function sizeLabel(o: ImageOption) {
    if (!o.width || !o.height) return "Size unknown"
    const ratio = o.width / o.height
    const shape = Math.abs(ratio - 16 / 9) < 0.06 ? "16:9" : Math.abs(ratio - 2 / 3) < 0.04 ? "2:3" : ratio > 1 ? "Wide" : "Tall"
    return `${o.width} × ${o.height} · ${shape}`
}

// A grid of images from the sources, each with its size, to pick one. Thumbnails load through the server.
export default function ImageChoices({ options, wide, busy, onChoose }: {
    options: ImageOption[]
    wide?: boolean
    busy?: boolean
    onChoose: (option: ImageOption) => void
}) {
    if (options.length === 0) return <p className="m-0 text-[14px] text-ink-muted">No images found in the linked sources.</p>
    return (
        <ul className={`m-0 grid max-h-96 list-none gap-3 overflow-y-auto p-0 [scrollbar-color:var(--color-line)_transparent] ${wide ? "grid-cols-2" : "grid-cols-3 sm:grid-cols-4"}`}>
            {options.map((o) => {
                const logo = PROVIDER_LOGOS[o.provider]
                const small = o.width !== null && (wide ? o.width < 1280 : o.width < 400)
                return (
                    <li key={o.url}>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => onChoose(o)}
                            aria-label={`Use this ${o.label?.toLowerCase() ?? "image"}, ${sizeLabel(o)}, from ${PROVIDER_NAMES[o.provider]}`}
                            className="group flex w-full cursor-pointer flex-col gap-1.5 rounded-md border border-line bg-bg p-1.5 text-left transition-colors hover:border-accent disabled:cursor-default disabled:opacity-50"
                        >
                            <img
                                src={`/api/images?url=${encodeURIComponent(o.url)}`}
                                alt=""
                                loading="lazy"
                                className={`w-full rounded object-cover ${wide ? "aspect-video" : "aspect-2/3"}`}
                            />
                            <span className={`text-[13px] ${small ? "text-ink-muted" : "text-ink"}`}>{sizeLabel(o)}</span>
                            <span className="flex items-center gap-1 text-[12px] text-ink-muted">
                                {logo && <img src={logo} alt="" className="size-3 rounded-sm" />}
                                {PROVIDER_NAMES[o.provider]}{o.label ? ` · ${o.label}` : ""}
                            </span>
                            {small && <span className="text-[12px] text-ink-muted">Small, may look soft</span>}
                        </button>
                    </li>
                )
            })}
        </ul>
    )
}
