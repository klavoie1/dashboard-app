import Icon from "../Icon.tsx";
import Tooltip from "../Tooltip.tsx";
import {PROVIDER_LOGOS, PROVIDER_NAMES, RATING_PROVIDERS, type Title} from "./titles.ts";

const COMPACT = new Intl.NumberFormat('en-US', { notation: 'compact' })
const FULL = new Intl.NumberFormat('en-US')

export default function TitleRatings({ title }: { title: Title }) {
    // Only providers that cover this media type, and only ones that have actually rated it
    const providers = RATING_PROVIDERS[title.type]
    const ratings = (title.ratings ?? []).filter((r) => providers.includes(r.provider) && r.count > 0)
    if (ratings.length === 0) return null

    // Every provider counts equally, each brought onto a 10-point scale first
    const average = ratings.reduce((sum, r) => sum + (r.score / r.scale) * 10, 0) / ratings.length
    const votes = ratings.reduce((sum, r) => sum + r.count, 0)
    const sources = ratings.map((r) => PROVIDER_NAMES[r.provider]).join(", ")

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Tooltip label={`Average of ${sources}`} side="bottom">
                <p
                    tabIndex={0}
                    aria-label={`Average rating ${average.toFixed(1)} out of 10 from ${FULL.format(votes)} ratings`}
                    className="m-0 flex items-center gap-2 rounded-sm text-ink"
                >
                    <Icon src="/icons/star.svg" box="size-4.5" className="text-accent" />
                    <span className="text-lg font-semibold">{average.toFixed(1)}</span>
                    <span className="text-[14px] text-ink-muted">/ 10 · {COMPACT.format(votes)} ratings</span>
                </p>
            </Tooltip>
            <ul aria-label="Community ratings by source" className="m-0 flex list-none flex-wrap gap-2 p-0">
                {ratings.map((r) => {
                    const name = PROVIDER_NAMES[r.provider]
                    const logo = PROVIDER_LOGOS[r.provider]
                    const score = r.scale === 100 ? `${r.score}%` : r.score.toFixed(1)
                    return (
                        <li key={r.provider}>
                            <Tooltip label={`${FULL.format(r.count)} ratings on ${name}`} side="bottom">
                                <a
                                    href={r.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`${name}: ${score} from ${FULL.format(r.count)} ratings`}
                                    className="flex items-center gap-2 rounded-md border border-line bg-bg/70 px-2.5 py-1.5 text-[13px] text-ink-soft backdrop-blur transition-colors hover:border-accent hover:text-ink"
                                >
                                    {/* The name only shows for providers without a logo yet */}
                                    {logo
                                        ? <img src={logo} alt="" className="size-4 rounded-sm" />
                                        : <span className="text-ink-muted">{name}</span>}
                                    <span className="font-semibold text-ink">{score}</span>
                                    <span className="text-ink-muted">· {COMPACT.format(r.count)}</span>
                                </a>
                            </Tooltip>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
