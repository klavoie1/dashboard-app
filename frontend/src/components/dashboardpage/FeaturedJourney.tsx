import {useState} from "react";
import {Link} from "react-router-dom";

// Images narrower than this (width / height) are treated as covers/posters
const POSTER_RATIO = 1.2

type FeaturedJourneyProps = {
    title: string
    subtitle?: string
    artwork: string
    // CSS object-position for wide artwork, e.g. "50% 25%" to keep faces in frame
    artworkPosition?: string
    nextUp: string
    progress: number
    total: number
    unit: string
    actionLabel: string
    viewLabel: string
    viewTo: string
    status: string
    onAction?: () => void
}

export default function FeaturedJourney({
    title,
    subtitle,
    artwork,
    artworkPosition = "50% 50%",
    nextUp,
    progress,
    total,
    unit,
    actionLabel,
    viewLabel,
    viewTo,
    status,
    onAction,
}: FeaturedJourneyProps) {
    const [posterSrc, setPosterSrc] = useState<string | null>(null)
    const isPoster = posterSrc === artwork
    const percent = total > 0 ? Math.min(100, (progress / total) * 100) : 0

    return (
        <section className="relative flex aspect-[1584/600] min-h-96 flex-col justify-center overflow-hidden px-4 py-13.5 md:px-8 xl:px-16">
            {/* Artwork with a left-side reading scrim and a bottom fade into the page */}
            {isPoster ? (
                // Tall covers: blurred copy fills the frame, full cover sits on the right
                <>
                    <img src={artwork} alt="" className="absolute inset-0 size-full scale-110 object-cover blur-2xl brightness-50" />
                    <img src={artwork} alt="" className="absolute top-[8%] right-[8%] h-[76%] w-auto rounded-md shadow-2xl" />
                </>
            ) : (
                <img
                    src={artwork}
                    alt=""
                    onLoad={(e) => {
                        const img = e.currentTarget
                        if (img.naturalWidth / img.naturalHeight < POSTER_RATIO) setPosterSrc(artwork)
                    }}
                    className="absolute inset-0 size-full object-cover"
                    style={{ objectPosition: artworkPosition }}
                />
            )}
            <div
                className="absolute inset-0"
                style={{ backgroundImage: "linear-gradient(90deg, rgb(17, 20, 18) 0%, rgba(17, 20, 18, 0.91) 32%, rgba(17, 20, 18, 0.133) 70%, rgba(17, 20, 18, 0) 100%)" }}
            />
            <div className="absolute inset-0 bg-linear-to-b from-transparent from-75% to-bg" />

            <div className="relative flex max-w-141.25 flex-col items-start gap-4.25">
                <p className="m-0 flex items-center gap-2.5 text-[13px] font-semibold text-accent">
                    <span aria-hidden="true" className="block h-0.5 w-7 bg-accent" />
                    PICK UP WHERE YOU LEFT OFF
                </p>

                <h2 className="m-0 flex flex-col font-serif font-normal text-ink">
                    <span className="text-[72px] leading-[1.05]">{title}</span>
                    {subtitle && <span className="text-[27px] leading-normal">{subtitle}</span>}
                </h2>

                <p className="m-0 text-base whitespace-pre text-ink-soft">{nextUp}</p>

                <div className="flex items-center gap-3">
                    <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={total}
                        aria-valuenow={progress}
                        aria-label={`${title} progress`}
                        className="h-1 w-50 overflow-hidden rounded bg-line"
                    >
                        <div className="h-full rounded bg-accent" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="m-0 text-[14px] text-ink-soft">{progress} / {total} {unit}</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onAction}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-accent bg-accent px-3.5 py-2.75 text-[15px] font-semibold text-bg transition-opacity hover:opacity-90"
                    >
                        <img src="/featured/check.svg" alt="" aria-hidden="true" width={15} height={15} />
                        {actionLabel}
                    </button>
                    <Link to={viewTo} className="flex items-center gap-1.75 text-[15px] text-ink transition-colors hover:text-accent">
                        {viewLabel}
                        <img src="/featured/arrow-up-right.svg" alt="" aria-hidden="true" width={14} height={14} />
                    </Link>
                </div>
            </div>

            <p className="absolute right-4 bottom-7.5 m-0 hidden items-center gap-2 text-[13px] text-ink md:flex md:right-8 xl:right-16">
                <span aria-hidden="true" className="block size-1.25 rounded-full bg-accent" />
                {status}
            </p>
        </section>
    )
}
