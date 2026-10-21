import {Link} from "react-router-dom";
import type {RelatedTitle} from "./titles.ts";

export default function RelatedTitles({ related }: { related: RelatedTitle[] }) {
    if (related.length === 0) return null

    return (
        <section id="related" className="flex flex-col gap-4.5 rounded-xl bg-surface p-6">
            <h2 className="m-0 text-[13px] font-semibold text-ink-muted uppercase">More in this series</h2>
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {related.map((t) => (
                    <li key={t.id} className="group relative flex items-center gap-4">
                        <img src={t.cover} alt="" className="h-21 w-15 shrink-0 rounded-[3px] object-cover" />
                        <div className="flex min-w-0 flex-col gap-2">
                            <p className="m-0 text-[12px] text-accent uppercase">{t.type}</p>
                            {/* ::after stretches the link over the whole row */}
                            <Link to={`/library/${t.id}`} className="text-[15px] font-semibold text-ink after:absolute after:inset-0 group-hover:text-accent">
                                {t.title}
                            </Link>
                            {t.creator && <p className="m-0 text-[13px] text-ink-muted">{t.creator}</p>}
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}
