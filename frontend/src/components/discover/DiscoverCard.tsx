import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import Tooltip from "../Tooltip.tsx";
import {proxied} from "../library/media.ts";
import {KIND_TO_TYPE} from "../mediapage/titleApi.ts";
import {PROVIDER_LOGOS, PROVIDER_NAMES} from "../mediapage/titles.ts";
import type {Hit} from "./discoverApi.ts";

// One suggestion, in the dashboard's discovery card style. Covers load through the server.
export default function DiscoverCard({ hit, reason, mediaId, adding, onAdd }: {
    hit: Hit
    reason?: string
    // Set once it's in your library
    mediaId: number | null
    adding: boolean
    onAdd: () => void
}) {
    const logo = PROVIDER_LOGOS[hit.provider]
    return (
        <div className="group relative flex h-full flex-col gap-3">
            <div className="relative">
                <img src={proxied(hit.imageUrl)} alt="" loading="lazy" className="aspect-2/3 w-full rounded-md bg-surface object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                {logo && <img src={logo} alt={`From ${PROVIDER_NAMES[hit.provider]}`} className="absolute bottom-2.5 left-2.5 size-5 rounded-sm" />}
                {mediaId === null && (
                    <Tooltip label="Add to library" className="absolute top-2.5 right-2.5 z-10">
                        <button
                            type="button"
                            disabled={adding}
                            onClick={onAdd}
                            aria-label={`Add ${hit.title} to library`}
                            className="flex size-7.5 cursor-pointer items-center justify-center rounded-md border border-line bg-bg text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                        >
                            <Icon src="/plus.svg" box="size-4" />
                        </button>
                    </Tooltip>
                )}
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
                <p className="m-0 text-[12px] text-accent uppercase">{KIND_TO_TYPE[hit.kind] ?? hit.kind}</p>
                <p className="m-0 text-base leading-[1.35] font-medium text-ink">{hit.title}</p>
                <p className="m-0 text-[13px] text-ink-muted">{[hit.detail, hit.year].filter(Boolean).join(" · ")}</p>
                {reason && <p className="m-0 text-[13px] text-ink-soft">{reason}</p>}
            </div>
            {mediaId !== null ? (
                <Link to={`/library/${mediaId}`} className="flex items-center gap-1.5 text-[14px] text-accent hover:opacity-80">
                    <Icon src="/featured/check.svg" box="size-3.5" />
                    In your library
                </Link>
            ) : adding ? <p role="status" className="m-0 text-[14px] text-ink-muted">Adding…</p> : null}
        </div>
    )
}
