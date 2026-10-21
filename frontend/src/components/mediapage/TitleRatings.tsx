import Tooltip from "../Tooltip.tsx";
import {PROVIDER_LOGOS, PROVIDER_NAMES, RATING_PROVIDERS, type Title} from "./titles.ts";

const COMPACT = new Intl.NumberFormat('en-US', { notation: 'compact' })
const FULL = new Intl.NumberFormat('en-US')

export default function TitleRatings({ title }: { title: Title }) {
    // Only providers that cover this media type, and only ones that have actually rated it
    const providers = RATING_PROVIDERS[title.type]
    const ratings = (title.ratings ?? []).filter((r) => providers.includes(r.provider) && r.count > 0)
    if (ratings.length === 0) return null

    return (
        <ul aria-label="Community ratings" className="m-0 flex list-none flex-wrap gap-2 p-0">
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
                                {logo && <img src={logo} alt="" className="size-4 rounded-sm" />}
                                <span className="text-ink-muted">{name}</span>
                                <span className="font-semibold text-ink">{score}</span>
                                <span className="text-ink-muted">· {COMPACT.format(r.count)}</span>
                            </a>
                        </Tooltip>
                    </li>
                )
            })}
        </ul>
    )
}
