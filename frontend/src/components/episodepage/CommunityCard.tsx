import Icon from "../Icon.tsx";
import type {EpisodeInfo} from "../mediapage/titles.ts";

const RANGES = ["9–10", "7–8", "1–6"]

export default function CommunityCard({ info }: { info: EpisodeInfo }) {
    if (info.rating === undefined) return null

    return (
        <section className="flex flex-col gap-4.5 rounded-xl bg-surface p-6">
            <h2 className="m-0 text-[13px] font-semibold text-ink-muted uppercase">The community’s take</h2>
            <div className="flex items-center gap-3.5">
                <Icon src="/icons/star.svg" box="size-6" className="text-accent" />
                <p className="m-0 font-serif text-[42px] leading-none text-ink">{info.rating.toFixed(1)}</p>
                <div className="flex flex-col gap-1.25">
                    <p className="m-0 text-[14px] text-ink-soft">out of 10</p>
                    {info.ratingCount && <p className="m-0 text-[13px] text-ink-muted">{info.ratingCount.toLocaleString('en-US')} episode ratings</p>}
                </div>
            </div>
            {info.distribution && (
                <dl className="m-0 flex flex-col gap-1.75">
                    {info.distribution.map((share, i) => (
                        <div key={RANGES[i]} className="flex items-center gap-2.5 text-[13px] text-ink-muted">
                            <dt className="w-10 shrink-0">{RANGES[i]}</dt>
                            <dd className="m-0 h-1.25 flex-1 overflow-hidden rounded-sm bg-surface-raised">
                                <span className={`block h-full rounded-sm ${i === 0 ? "bg-accent" : "bg-ink-muted"}`} style={{ width: `${share}%` }} />
                            </dd>
                            <dd className="m-0 w-10 shrink-0 text-right">{share}%</dd>
                        </div>
                    ))}
                </dl>
            )}
        </section>
    )
}
