import {useState} from "react";
import Icon from "../Icon.tsx";
import type {EpisodeInfo} from "../mediapage/titles.ts";

export default function EpisodeSummary({ info, watched }: { info: EpisodeInfo, watched: boolean }) {
    const [showRecap, setShowRecap] = useState(false)

    return (
        <section id="overview" className="flex flex-col gap-4.5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="m-0 font-serif text-3xl font-normal text-ink">{info.headline ?? "About this episode"}</h2>
                {info.headline && <p className="m-0 text-[14px] text-ink-muted uppercase">About this episode</p>}
            </div>

            {info.summary ? (
                <>
                    <p className="m-0 flex items-center gap-1.75 text-[14px] text-ink-soft">
                        <Icon src="/episode-icons/shield-check.svg" box="size-3.5" className="text-accent" />
                        Spoiler-free summary
                    </p>
                    <p className="m-0 text-base leading-[1.8] text-ink-soft">{info.summary}</p>
                </>
            ) : (
                <p className="m-0 text-base text-ink-muted">No summary yet. It will fill in from your linked sources.</p>
            )}

            {info.recap && (
                <div className="rounded-md border border-line bg-surface">
                    <button
                        type="button"
                        aria-expanded={showRecap}
                        aria-controls="episode-recap"
                        onClick={() => setShowRecap((v) => !v)}
                        className="flex w-full cursor-pointer items-center gap-2.5 p-4 text-left"
                    >
                        <Icon src={showRecap ? "/episode-icons/eye.svg" : "/episode-icons/eye-off.svg"} box="size-4" className="text-ink-soft" />
                        <span className="flex-1 text-[15px] text-ink-soft">
                            Full recap & ending · {watched ? "You’ve watched this one" : "Contains episode spoilers"}
                        </span>
                        <span className="text-[14px] font-semibold text-accent">{showRecap ? "Hide recap" : "Reveal recap"}</span>
                        <Icon src="/episode-icons/chevron-down.svg" box="size-3.5" className={`text-accent transition-transform ${showRecap ? "rotate-180" : ""}`} />
                    </button>
                    {showRecap && (
                        <p id="episode-recap" className="m-0 border-t border-line p-4 text-base leading-[1.8] text-ink-soft">{info.recap}</p>
                    )}
                </div>
            )}
        </section>
    )
}
