import {useParams} from "react-router-dom";

// Placeholder until the media detail page (Figma "Anime Example") is built
export default function MediaPage() {
    const {id} = useParams()

    return (
        <main className="py-10">
            <h1 className="m-0 font-serif text-3xl font-normal text-ink">Media {id}</h1>
            <p className="m-0 mt-2 text-xs text-ink-muted">The detail page for this title is coming soon.</p>
        </main>
    )
}
