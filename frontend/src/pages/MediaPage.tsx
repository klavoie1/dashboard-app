import {Link, useParams} from "react-router-dom";
import {findTitle, PROGRESS_KIND} from "../components/mediapage/titles.ts";
import TitleHero from "../components/mediapage/TitleHero.tsx";
import TitleProgress from "../components/mediapage/TitleProgress.tsx";
import TitleDetails from "../components/mediapage/TitleDetails.tsx";
import TitleNote from "../components/mediapage/TitleNote.tsx";
import RelatedTitles from "../components/mediapage/RelatedTitles.tsx";

// Shared shell for every media type; only the progress section changes per kind
export default function MediaPage() {
    const {id} = useParams()
    const title = findTitle(Number(id))

    if (!title) {
        return (
            <main className="py-10">
                <h1 className="m-0 font-serif text-3xl font-normal text-ink">Title not found</h1>
                <Link to="/" className="mt-3 inline-block text-[14px] text-accent hover:opacity-80">Back home</Link>
            </main>
        )
    }

    return (
        <main className="flex flex-col gap-10 py-6 md:py-10">
            <TitleHero title={title} />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-6">
                    <section className="flex flex-col gap-3">
                        <h2 className="m-0 font-serif text-3xl font-normal text-ink">About</h2>
                        <p className="m-0 max-w-[65ch] text-base leading-relaxed text-ink-soft">{title.synopsis}</p>
                    </section>
                    <TitleProgress title={title} kind={PROGRESS_KIND[title.type]} />
                    <TitleNote note={title.note} />
                </div>
                <aside className="flex flex-col gap-6">
                    <TitleDetails title={title} />
                </aside>
            </div>

            <RelatedTitles ids={title.related} />
        </main>
    )
}
