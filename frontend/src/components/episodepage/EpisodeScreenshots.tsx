import {useRef, useState} from "react";
import Icon from "../Icon.tsx";
import type {EpisodeInfo} from "../mediapage/titles.ts";

type Shot = NonNullable<EpisodeInfo["screenshots"]>[number]

export default function EpisodeScreenshots({ shots, watched, onAdd }: { shots: Shot[], watched: boolean, onAdd?: () => void }) {
    // Screenshots can spoil, so they stay blurred until you've watched or choose to look
    const [revealed, setRevealed] = useState(watched)
    const [open, setOpen] = useState<number | null>(null)
    const dialogRef = useRef<HTMLDialogElement>(null)
    const total = String(shots.length).padStart(2, "0")
    const [first, ...rest] = shots

    if (shots.length === 0) {
        return (
            <section id="screenshots" className="flex flex-col gap-4">
                <h2 className="m-0 font-serif text-3xl font-normal text-ink">Moments along the way</h2>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-line p-5">
                    <p className="m-0 text-base text-ink-muted">No screenshots yet. Upload your own or pick stills from your sources.</p>
                    {onAdd && (
                        <button type="button" onClick={onAdd} className="flex cursor-pointer items-center gap-1.5 text-[15px] text-accent hover:opacity-80">
                            <Icon src="/plus.svg" box="size-3.5" />
                            Add screenshots
                        </button>
                    )}
                </div>
            </section>
        )
    }

    function expand(i: number) {
        setOpen(i)
        dialogRef.current?.showModal()
    }

    function frame(shot: Shot, i: number, size: string) {
        return (
            <figure key={shot.src} className={`group relative m-0 overflow-hidden rounded-md ${size}`}>
                <img src={shot.src} alt={shot.caption} className={`size-full object-cover transition-[filter] ${revealed ? "" : "blur-xl"}`} />
                <div className="absolute inset-x-0 bottom-0 h-15 bg-linear-to-b from-transparent to-bg/80" />
                <figcaption className="absolute bottom-3 left-3.5 text-[13px] text-ink">
                    {String(i + 1).padStart(2, "0")} / {total} · {shot.caption}
                </figcaption>
                {revealed && (
                    <button
                        type="button"
                        onClick={() => expand(i)}
                        aria-label={`Expand screenshot: ${shot.caption}`}
                        className="absolute top-2.5 right-2.5 flex cursor-pointer rounded bg-bg/70 p-1.5 text-ink transition-colors hover:text-accent"
                    >
                        <Icon src="/episode-icons/expand.svg" box="size-3" />
                    </button>
                )}
            </figure>
        )
    }

    return (
        <section id="screenshots" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="m-0 font-serif text-3xl font-normal text-ink">Moments along the way</h2>
                <div className="flex items-center gap-4">
                    <p className="m-0 text-[14px] text-ink-muted">{shots.length} {shots.length === 1 ? "screenshot" : "screenshots"}</p>
                    {onAdd && (
                        <button type="button" onClick={onAdd} className="flex cursor-pointer items-center gap-1.5 text-[15px] text-accent hover:opacity-80">
                            <Icon src="/plus.svg" box="size-3.5" />
                            Add screenshots
                        </button>
                    )}
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 text-[14px] text-ink-muted">A few frames to remember this chapter by.</p>
                {revealed ? (
                    <p className="m-0 flex items-center gap-1.5 text-[13px] text-ink-muted">
                        <Icon src="/episode-icons/eye.svg" box="size-3.25" />
                        {watched ? "Visible · You’ve watched this episode" : "Visible · May contain spoilers"}
                    </p>
                ) : (
                    <button type="button" onClick={() => setRevealed(true)} className="flex cursor-pointer items-center gap-1.5 text-[13px] text-accent hover:opacity-80">
                        <Icon src="/episode-icons/eye-off.svg" box="size-3.25" />
                        Hidden until you watch · Show anyway
                    </button>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,584fr)_minmax(0,296fr)]">
                {frame(first, 0, "aspect-video md:aspect-auto md:h-82")}
                {rest.length > 0 && (
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-1">
                        {rest.slice(0, 2).map((shot, i) => frame(shot, i + 1, "aspect-video md:aspect-auto md:h-39"))}
                    </div>
                )}
            </div>
            {rest.length > 2 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {rest.slice(2).map((shot, i) => frame(shot, i + 3, "aspect-video"))}
                </div>
            )}

            <dialog
                ref={dialogRef}
                onClose={() => setOpen(null)}
                aria-label="Screenshot"
                className="m-auto max-w-[min(72rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface p-0 backdrop:bg-black/80"
            >
                {open !== null && (
                    <figure className="m-0">
                        <img src={shots[open].src} alt={shots[open].caption} className="block max-h-[80vh] w-full object-contain" />
                        <figcaption className="flex items-center justify-between gap-4 px-4 py-3 text-[14px] text-ink-soft">
                            {shots[open].caption}
                            <button type="button" onClick={() => dialogRef.current?.close()} className="cursor-pointer text-accent hover:opacity-80">Close</button>
                        </figcaption>
                    </figure>
                )}
            </dialog>
        </section>
    )
}
