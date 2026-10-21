import {useState} from "react";
import Icon from "../Icon.tsx";
import type {EpisodeInfo} from "../mediapage/titles.ts";

type EpisodePatch = { watchedOn?: string, views?: number, favorite?: boolean }

export default function YourEpisodeCard({ info, watched, onWatchedChange, onChange, onRate }: {
    info: EpisodeInfo
    watched: boolean
    onWatchedChange: (watched: boolean) => void
    // Saves a change; missing when this episode isn't stored on the server yet
    onChange?: (patch: EpisodePatch) => void
    onRate?: () => void
}) {
    const [watchedOn, setWatchedOn] = useState(info.watchedOn ?? "")
    const [rewatches, setRewatches] = useState(info.rewatches ?? 0)
    const [favorite, setFavorite] = useState(info.favorite ?? false)

    return (
        <section className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-6">
            <h2 className="m-0 font-serif text-[27px] font-normal text-ink">Your episode</h2>

            <label className={`relative flex items-center gap-2.5 rounded-md p-3.25 text-base font-semibold ${watched ? "bg-accent-soft text-accent" : "bg-surface-raised text-ink"}`}>
                <span className="sr-only">Status</span>
                {watched
                    ? <Icon src="/featured/check.svg" box="size-4" />
                    : <span aria-hidden="true" className="block size-1.5 rounded-full bg-ink-muted" />}
                <select
                    value={watched ? "watched" : "unwatched"}
                    onChange={(e) => onWatchedChange(e.target.value === "watched")}
                    className="flex-1 cursor-pointer appearance-none bg-transparent [color-scheme:dark] focus:outline-none"
                >
                    <option value="watched">Watched</option>
                    <option value="unwatched">Not watched</option>
                </select>
                <Icon src="/episode-icons/chevron-down.svg" box="size-4" className="pointer-events-none" />
            </label>

            {watched && (
                <label className="flex flex-col gap-2.25 text-[13px] text-ink-muted uppercase">
                    Watched on
                    <span className="flex items-center gap-2.25 rounded-md border border-line p-3 focus-within:border-accent">
                        <Icon src="/space-icons/calendar-days.svg" box="size-3.75" className="text-ink-soft" />
                        <input
                            type="date"
                            value={watchedOn}
                            onChange={(e) => {
                                setWatchedOn(e.target.value)
                                if (e.target.value) onChange?.({ watchedOn: e.target.value })
                            }}
                            className="flex-1 bg-transparent text-[15px] text-ink normal-case [color-scheme:dark] focus:outline-none"
                        />
                    </span>
                </label>
            )}

            <hr className="m-0 h-px border-0 bg-line" />

            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1.25">
                    <p className="m-0 text-[15px] text-ink-soft">Your rating</p>
                    <button type="button" onClick={onRate} disabled={!onRate} className="cursor-pointer self-start text-[13px] text-ink-muted hover:text-accent disabled:cursor-default disabled:hover:text-ink-muted">
                        {info.yourRating ? "Edit rating" : "Rate it"}
                    </button>
                </div>
                <p className="m-0 flex items-baseline gap-1.75 text-ink">
                    <Icon src="/icons/star.svg" box="size-4.75 self-center" className={info.yourRating ? "text-accent" : "text-ink-muted"} />
                    <span className="text-[28px]">{info.yourRating?.toFixed(1) ?? "—"}</span>
                    <span className="text-[14px] text-ink-muted">/ 10</span>
                </p>
            </div>

            <hr className="m-0 h-px border-0 bg-line" />

            <div className="flex items-center justify-between">
                <p className="m-0 flex items-center gap-2 text-[15px] text-ink-soft">
                    <Icon src="/episode-icons/repeat-2.svg" box="size-3.75" />
                    Rewatches
                </p>
                <p className="m-0 text-lg text-ink">{rewatches}</p>
            </div>
            <button
                type="button"
                onClick={() => {
                    // views counts the first watch too
                    onChange?.({ views: rewatches + 2 })
                    setRewatches(rewatches + 1)
                }}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-line py-2.5 text-[15px] font-medium text-accent transition-colors hover:border-accent"
            >
                <Icon src="/plus.svg" box="size-3.5" />
                Log a rewatch
            </button>
            <button
                type="button"
                aria-pressed={favorite}
                onClick={() => {
                    onChange?.({ favorite: !favorite })
                    setFavorite(!favorite)
                }}
                className="flex cursor-pointer items-center justify-center gap-2 text-[14px] text-ink-soft transition-colors hover:text-accent aria-pressed:text-accent"
            >
                <Icon src="/episode-icons/heart.svg" box="size-3.5" />
                {favorite ? "One of your favorite episodes" : "Add to favorite episodes"}
            </button>
        </section>
    )
}
