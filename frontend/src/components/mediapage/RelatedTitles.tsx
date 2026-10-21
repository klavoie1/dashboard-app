import {Link} from "react-router-dom";
import {findTitle, type Title} from "./titles.ts";

export default function RelatedTitles({ ids }: { ids: number[] }) {
    const related = ids.map(findTitle).filter((t): t is Title => t !== undefined)
    if (related.length === 0) return null

    return (
        <section className="flex flex-col gap-6">
            <h2 className="m-0 font-serif text-3xl font-normal text-ink">Connected stories</h2>
            <ul className="m-0 grid list-none grid-cols-2 gap-5 p-0 md:grid-cols-4 lg:grid-cols-6">
                {related.map((t) => (
                    <li key={t.id} className="group relative flex flex-col gap-2">
                        <img src={t.cover} alt="" className="aspect-2/3 w-full rounded-md object-cover" />
                        <p className="m-0 text-[12px] text-accent uppercase">{t.type}</p>
                        <Link to={`/library/${t.id}`} className="text-base font-medium text-ink after:absolute after:inset-0 group-hover:text-accent">
                            {t.title}
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    )
}
