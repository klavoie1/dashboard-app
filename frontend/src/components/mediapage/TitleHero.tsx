import {useState} from "react";
import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import {CATEGORY_IDS, type Title} from "./titles.ts";
import TitleRatings from "./TitleRatings.tsx";

// Long descriptions fold after six lines so the hero stays a hero
const FOLD_AT = 420

function Synopsis({ text }: { text: string }) {
    const [open, setOpen] = useState(false)
    if (!text) return null
    const long = text.length > FOLD_AT
    return (
        <div className="flex max-w-136 flex-col items-start gap-1.5">
            <p className={`m-0 text-base leading-[1.7] whitespace-pre-line text-ink-soft ${long && !open ? "line-clamp-6" : ""}`}>{text}</p>
            {long && (
                <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="cursor-pointer text-[14px] text-accent hover:opacity-80">
                    {open ? "Show less" : "Read more"}
                </button>
            )}
        </div>
    )
}

export default function TitleHero({ title, length, onEdit }: { title: Title, length: string | null, onEdit: () => void }) {
    const meta = [title.yearRange ?? (title.year ? String(title.year) : null), title.format ?? title.type, length].filter(Boolean)

    return (
        <section className="relative -mx-4 flex min-h-[32rem] flex-col justify-between gap-10 overflow-hidden px-4 py-7 md:mx-0 md:px-8 xl:px-16">
            {title.backdrop ? (
                <img
                    src={title.backdrop}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                    style={{ objectPosition: title.backdropPosition }}
                />
            ) : (
                // Covers only: blurred copy fills the frame, the cover itself sits on the right
                <>
                    <img src={title.cover} alt="" className="absolute inset-0 size-full scale-110 object-cover blur-2xl brightness-50" />
                    {/* The cover doubles as a shortcut to edit the title */}
                    <button
                        type="button"
                        onClick={onEdit}
                        aria-label={`Edit ${title.title}`}
                        className="group absolute top-[10%] right-[8%] hidden h-[80%] cursor-pointer md:block"
                    >
                        <img src={title.cover} alt="" className="h-full w-auto rounded-md shadow-2xl" />
                        <span className="absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-bg/60 text-[15px] font-semibold text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                            <Icon src="/pencil.svg" box="size-4" />
                            Edit
                        </span>
                    </button>
                </>
            )}
            <div
                className="absolute inset-0"
                style={{ backgroundImage: "linear-gradient(90deg, rgb(17, 20, 18) 0%, rgba(17, 20, 18, 0.941) 31%, rgba(17, 20, 18, 0.251) 62%, rgba(17, 20, 18, 0) 100%)" }}
            />
            <div className="absolute inset-0 bg-linear-to-b from-transparent from-50% to-bg" />

            <nav aria-label="Breadcrumb" className="relative">
                <ol className="m-0 flex list-none flex-wrap items-center gap-2.25 p-0 text-[14px] text-ink-soft">
                    <li><Link to="/library" className="hover:text-ink">My library</Link></li>
                    <li aria-hidden="true"><Icon src="/space-icons/chevron-right.svg" box="size-3" /></li>
                    <li><Link to={`/library?category=${CATEGORY_IDS[title.type]}`} className="hover:text-ink">{title.type}</Link></li>
                    <li aria-hidden="true"><Icon src="/space-icons/chevron-right.svg" box="size-3" /></li>
                    <li aria-current="page" className="text-ink">{title.title}{title.subtitle && `: ${title.subtitle}`}</li>
                </ol>
            </nav>

            <div className="relative flex max-w-147.5 flex-col items-start gap-4.5">
                <p className="m-0 flex items-center gap-3 text-[13px] font-semibold text-accent uppercase">
                    <span aria-hidden="true" className="block h-0.5 w-7 bg-accent" />
                    {title.type}
                </p>

                <h1 className="m-0 flex flex-col font-serif font-normal text-ink">
                    {/* Long titles step down so they don't run into a cover on the right */}
                    <span className={`text-5xl leading-none ${title.title.length > 16 ? "md:text-[64px]" : "md:text-[104px]"}`}>{title.title}</span>
                    {title.subtitle && <span className="text-[26px] leading-normal md:text-[33px]">{title.subtitle}</span>}
                </h1>

                <div className="flex flex-wrap items-center gap-3">
                    <p className="m-0 text-[15px] whitespace-pre text-ink-soft">{meta.join("  ·  ")}</p>
                    {title.ageRating && (
                        <span className="rounded-[3px] border border-ink-soft px-1.5 py-0.75 text-[12px] text-ink-soft">{title.ageRating}</span>
                    )}
                </div>

                <Synopsis text={title.synopsis} />

                <ul aria-label="Genres" className="m-0 flex list-none flex-wrap gap-2.5 p-0">
                    {title.tags.map((tag) => (
                        <li key={tag} className="rounded-md bg-white/4 px-2.5 py-1.5 text-[13px] text-ink-soft">{tag}</li>
                    ))}
                </ul>

                <TitleRatings title={title} />
            </div>
        </section>
    )
}
