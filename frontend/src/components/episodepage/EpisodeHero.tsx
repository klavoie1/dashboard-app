import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import {CATEGORY_IDS, type EpisodeRef, type Title} from "../mediapage/titles.ts";
import {eyebrow, longDate} from "./format.ts";

export default function EpisodeHero({ title, ep, artwork }: { title: Title, ep: EpisodeRef, artwork?: string }) {
    const seriesName = `${title.title}${title.subtitle ? `: ${title.subtitle}` : ""}`
    const seriesLink = `/library/${title.id}${ep.season ? `?season=${ep.season}` : ""}`
    const studio = title.details.find((d) => d.label === "Studio" || d.label === "Network")?.value
    const meta = [ep.aired && longDate(ep.aired), ep.minutes && `${ep.minutes} min`, studio, title.ageRating].filter(Boolean)
    const image = artwork ?? title.backdrop

    return (
        <section className="relative -mx-4 flex min-h-112 flex-col justify-between gap-10 overflow-hidden px-4 pt-7 pb-8 md:mx-0 md:px-8 xl:px-16">
            {image ? (
                <img src={image} alt="" className="absolute inset-0 size-full object-cover" style={{ objectPosition: artwork ? undefined : title.backdropPosition }} />
            ) : (
                <img src={title.cover} alt="" className="absolute inset-0 size-full scale-110 object-cover blur-2xl brightness-50" />
            )}
            <div
                className="absolute inset-0"
                style={{ backgroundImage: "linear-gradient(90deg, rgb(17, 20, 18) 0%, rgba(17, 20, 18, 0.941) 36%, rgba(17, 20, 18, 0.125) 76%, rgba(17, 20, 18, 0) 100%)" }}
            />
            <div className="absolute inset-0 bg-linear-to-b from-transparent from-35% to-bg" />

            <nav aria-label="Breadcrumb" className="relative">
                <ol className="m-0 flex list-none flex-wrap items-center gap-2.5 p-0 text-[14px] text-ink-soft">
                    <li><Link to="/library" className="hover:text-ink">My library</Link></li>
                    <li aria-hidden="true"><Icon src="/space-icons/chevron-right.svg" box="size-3" /></li>
                    <li><Link to={`/library?category=${CATEGORY_IDS[title.type]}`} className="hover:text-ink">{title.type}</Link></li>
                    <li aria-hidden="true"><Icon src="/space-icons/chevron-right.svg" box="size-3" /></li>
                    <li><Link to={seriesLink} className="hover:text-ink">{seriesName}</Link></li>
                    <li aria-hidden="true"><Icon src="/space-icons/chevron-right.svg" box="size-3" /></li>
                    <li aria-current="page" className="text-ink">Episode {String(ep.number).padStart(2, "0")}</li>
                </ol>
            </nav>

            <div className="relative flex max-w-190 flex-col items-start gap-4">
                <p className="m-0 flex items-center gap-3 text-[13px] font-semibold text-accent uppercase">
                    <span aria-hidden="true" className="block h-0.5 w-7 bg-accent" />
                    {eyebrow(title, ep)}
                </p>
                <h1 className="m-0 font-serif text-5xl leading-[1.08] font-normal text-ink md:text-[64px]">{ep.title}</h1>
                <Link to={seriesLink} className="flex items-center gap-2 font-serif text-[24px] text-ink-soft transition-colors hover:text-ink">
                    {seriesName}
                    <Icon src="/featured/arrow-up-right.svg" box="size-3.75" />
                </Link>
                {meta.length > 0 && <p className="m-0 text-[15px] whitespace-pre text-ink-soft">{meta.join("  ·  ")}</p>}
            </div>
        </section>
    )
}
