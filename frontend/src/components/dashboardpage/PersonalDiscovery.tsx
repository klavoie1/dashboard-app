import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import Tooltip from "../Tooltip.tsx";

type Recommendation = {
    id: number
    type: string
    title: string
    creator: string
    reason: string
    rating: number
    cover: string
}

// Placeholder picks until recommendations come from the metadata providers
const RECOMMENDATIONS: Recommendation[] = [
    { id: 101, type: "Manga", title: "Frieren: Beyond Journey's End", creator: "Kanehito Yamada · Tsukasa Abe", reason: "The story behind your anime", rating: 9.1, cover: "/discover/frieren-manga.jpg" },
    { id: 102, type: "Book", title: "A Wizard of Earthsea", creator: "Ursula K. Le Guin · 1968", reason: "Because you read Ursula K. Le Guin", rating: 8.7, cover: "/discover/wizard-of-earthsea.jpg" },
    { id: 103, type: "Game", title: "Spiritfarer", creator: "Thunder Lotus · 2020", reason: "Quiet worlds, big feelings", rating: 8.8, cover: "/discover/spiritfarer.jpg" },
    { id: 104, type: "Movie", title: "The Boy and the Heron", creator: "Hayao Miyazaki · 2023", reason: "For your love of animated worlds", rating: 8.3, cover: "/discover/boy-and-the-heron.jpg" },
    { id: 105, type: "Audiobook", title: "Piranesi", creator: "Susanna Clarke · Chiwetel Ejiofor", reason: "A little wonder for your next walk", rating: 8.9, cover: "/discover/piranesi.jpg" },
]

export default function PersonalDiscovery({ onAdd }: { onAdd?: (id: number) => void }) {
    return (
        <section className="flex flex-col gap-6 py-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                    <h2 className="m-0 font-serif text-3xl font-normal text-ink">
                        Your next story is out there
                    </h2>
                    <p className="m-0 text-[15px] text-ink-muted">
                        A few things we think will stay with you, across every medium.
                    </p>
                </div>
                <Link to="/discover" className="flex items-center gap-2 text-[14px] text-accent transition-opacity hover:opacity-80">
                    Explore Discover
                    <Icon src="/featured/arrow-up-right.svg" box="size-[13px]" />
                </Link>
            </div>

            <ul className="m-0 grid list-none grid-cols-2 gap-5 p-0 md:grid-cols-3 lg:grid-cols-5">
                {RECOMMENDATIONS.map((rec) => (
                    <li key={rec.id} className="group relative flex flex-col gap-3">
                        {/* Only the artwork is clipped, so tooltips on the badge can overflow the cover */}
                        <div className="relative h-70">
                            <div className="size-full overflow-hidden rounded-md">
                                <img
                                    src={rec.cover}
                                    alt=""
                                    className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                />
                            </div>
                            <Tooltip label="Community rating" side="bottom" className="absolute bottom-2.5 left-2.5 z-10">
                                <p className="m-0 flex items-center gap-1.25 rounded bg-bg px-2 py-1.5 text-[14px] text-ink">
                                    <Icon src="/discover/star.svg" box="size-3" className="text-accent" />
                                    <span className="sr-only">Community rating</span>
                                    {rec.rating.toFixed(1)}
                                </p>
                            </Tooltip>
                        </div>

                        {/* Sits above the card link so adding doesn't open the page */}
                        <Tooltip label="Add to library" className="absolute top-2.5 right-2.5 z-10">
                            <button
                                type="button"
                                onClick={() => onAdd?.(rec.id)}
                                aria-label={`Add ${rec.title} to library`}
                                className="flex size-7.5 cursor-pointer items-center justify-center rounded-md border border-line bg-bg text-ink transition-colors hover:border-accent hover:text-accent"
                            >
                                <Icon src="/plus.svg" box="size-4" />
                            </button>
                        </Tooltip>

                        <div className="flex flex-col gap-1.75">
                            <p className="m-0 text-[12px] text-accent uppercase">{rec.type}</p>
                            {/* The link's ::after covers the whole card, like MediaCard */}
                            <Link
                                to={`/media/${rec.id}`}
                                className="text-lg leading-[1.35] font-medium text-ink after:absolute after:inset-0 group-hover:text-accent"
                            >
                                {rec.title}
                            </Link>
                            <p className="m-0 text-[13px] text-ink-muted">{rec.creator}</p>
                            <p className="m-0 text-[13px] leading-normal text-ink-soft">{rec.reason}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}
