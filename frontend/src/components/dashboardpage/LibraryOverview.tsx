import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import {CATEGORIES, type MediaSummary} from "../library/media.ts";

export default function LibraryOverview({ media }: { media: MediaSummary[] | null }) {
    const SHELVES = CATEGORIES.map((c) => ({ ...c, count: media?.filter((m) => m.kind === c.kind).length ?? 0 }))
    const TOTAL = media?.length ?? 0
    return (
        <section className="flex h-full flex-col gap-5.5 rounded-xl border border-line p-6">
            <div className="flex items-center justify-between gap-4">
                <h2 className="m-0 font-serif text-[27px] font-normal text-ink">
                    Your library, all together
                </h2>
                <p className="m-0 shrink-0 text-[14px] text-ink-muted">
                    {TOTAL} titles
                </p>
            </div>

            {/* Two columns of shelves, each a link into that part of the library */}
            <ul className="m-0 grid list-none grid-cols-1 gap-x-6 p-0 sm:grid-cols-2">
                {SHELVES.map((shelf) => (
                    <li key={shelf.id}>
                        <Link
                            to={`/library?category=${shelf.id}`}
                            className="group flex h-12 items-center gap-2.5 border-b border-line text-ink-soft"
                        >
                            <Icon src={shelf.icon} box="size-[15px]" className="text-ink-muted transition-colors group-hover:text-accent" />
                            <span className="flex-1 text-[15px] transition-colors group-hover:text-ink">
                                {shelf.label}
                            </span>
                            <span className="text-[15px] text-ink">
                                {shelf.count}
                            </span>
                            <Icon src="/space-icons/chevron-right.svg" box="size-3" className="text-ink-muted transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </li>
                ))}
            </ul>

            <Link to="/library" className="mt-auto flex items-center gap-1.75 self-start text-[14px] text-accent transition-opacity hover:opacity-80">
                Open my library
                <Icon src="/featured/arrow-up-right.svg" box="size-[13px]" />
            </Link>
        </section>
    )
}
