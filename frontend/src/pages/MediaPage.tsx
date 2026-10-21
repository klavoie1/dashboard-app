import {useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {api} from "../api.ts";
import {PROGRESS_KIND, type Title} from "../components/mediapage/titles.ts";
import {statusValue, toRequest, type MediaDetail, type SuggestResult} from "../components/mediapage/titleApi.ts";
import {useTitle} from "../components/mediapage/useTitle.ts";
import {ACTIVE_STATUS, journeyFor, lengthLabel, sectionLabel} from "../components/mediapage/progress/journey.ts";
import TitleStatus from "../components/mediapage/TitleStatus.tsx";
import NoteDialog, {type NoteDraft} from "../components/NoteDialog.tsx";
import RatingDialog from "../components/RatingDialog.tsx";
import EditTitleDialog from "../components/mediapage/EditTitleDialog.tsx";
import TitleHero from "../components/mediapage/TitleHero.tsx";
import TitleTabs from "../components/mediapage/TitleTabs.tsx";
import TitleCollection from "../components/mediapage/TitleCollection.tsx";
import JourneyCard from "../components/mediapage/JourneyCard.tsx";
import TitleNote from "../components/mediapage/TitleNote.tsx";
import CollectionCard from "../components/mediapage/CollectionCard.tsx";
import TitleDetails from "../components/mediapage/TitleDetails.tsx";
import RelatedTitles from "../components/mediapage/RelatedTitles.tsx";
import CastSection from "../components/characters/CastSection.tsx";
import MediaGallery from "../components/MediaGallery.tsx";
import ReviewSection from "../components/reviews/ReviewSection.tsx";
import type {ImageOption} from "../components/ImageChoices.tsx";

export default function MediaPage() {
    const {id} = useParams()
    const {state, reload} = useTitle(Number(id))

    if (state.status !== "ready") return <TitleStatus status={state.status} />
    // key resets local progress when moving between titles
    return <TitleView key={state.media.id} title={state.title} media={state.media} reload={reload} />
}

// Shared shell for every media type; the main section and journey summary change per kind
function TitleView({ title, media, reload }: { title: Title, media: MediaDetail, reload: () => Promise<void> }) {
    const [editing, setEditing] = useState(false)
    // Which note the dialog is writing: a new one, or the one shown
    const [noteMode, setNoteMode] = useState<"new" | "edit" | null>(null)
    const [rating, setRating] = useState(false)
    const navigate = useNavigate()
    const kind = PROGRESS_KIND[title.type]
    // Shown straight away, then saved; a failed save puts the old value back
    const [progress, setProgressState] = useState(title.progress)
    const [hours, setHoursState] = useState(title.hoursPlayed ?? 0)

    function saveProgress(next: number, nextHours = hours) {
        const before = { progress, hours }
        setProgressState(next)
        setHoursState(nextHours)
        api.patch(`/media/${title.id}/progress`, { progress: next, hoursPlayed: kind === "playtime" ? nextHours : undefined })
            .catch(() => {
                setProgressState(before.progress)
                setHoursState(before.hours)
            })
    }

    const journey = journeyFor(kind, title, {
        progress,
        setProgress: (n) => saveProgress(n),
        hours,
        setHours: (h) => saveProgress(progress, h),
    })

    async function saveEdits(draft: Title) {
        await api.put(`/media/${title.id}`, toRequest(draft, media))
        await saveLinks(draft.links ?? {})
        await reload()
    }

    // Sends every provider, so a cleared box unlinks it
    function saveLinks(links: Record<string, string>) {
        const all = Object.fromEntries([...new Set([...Object.keys(media.links), ...Object.keys(links)])].map((p) => [p, links[p] ?? ""]))
        return api.put(`/media/${title.id}/links`, all)
    }

    // Ratings and episodes refresh on the page; field suggestions go back to the dialog to review
    async function fetchFromSources(links: Record<string, string>) {
        await saveLinks(links)
        const { data } = await api.post<SuggestResult>(`/media/${title.id}/suggest`)
        await reload()
        return data
    }

    async function artworkOptions(slot: "cover" | "backdrop") {
        const { data } = await api.get<{ options: ImageOption[] }>(`/media/${title.id}/artwork-options`, { params: { slot } })
        return data.options
    }

    async function useArtwork(slot: "cover" | "backdrop", url: string) {
        const { data } = await api.post<MediaDetail>(`/media/${title.id}/artwork/${slot}/from-url`, { url })
        return (slot === "cover" ? data.cover : data.backdrop) ?? ""
    }

    async function saveNote(note: NoteDraft) {
        const body = { quote: note.quote, reflection: note.reflection || null }
        if (noteMode === "edit" && title.note?.id) await api.put(`/journal/${title.note.id}`, { ...body, writtenOn: title.note.date })
        else await api.post(`/media/${title.id}/journal`, body)
        await reload()
    }

    async function deleteNote() {
        await api.delete(`/journal/${title.note!.id}`)
        await reload()
    }

    async function saveRating(value: number | null) {
        await api.put(`/media/${title.id}`, toRequest(title, media, { rating: value }))
        await reload()
    }

    async function remove() {
        await api.delete(`/media/${title.id}`)
        navigate("/library")
    }

    // Reading is where reviews matter most, so books and comics put them first
    const readsFirst = kind === "pages" || kind === "listening"
    const reviews = (
        <ReviewSection
            mediaId={title.id}
            title={title.title}
            prompt={kind === "pages" ? "What did this book leave you with?" : kind === "listening" ? "How did this one sound to you?" : "What stayed with you?"}
            onRated={(value) => saveRating(value)}
        />
    )

    async function uploadArtwork(slot: "cover" | "backdrop", file: File) {
        const form = new FormData()
        form.append("file", file)
        const { data } = await api.post<MediaDetail>(`/media/${title.id}/artwork/${slot}`, form)
        return (slot === "cover" ? data.cover : data.backdrop) ?? ""
    }

    return (
        <main className="pb-16">
            <TitleHero title={title} length={lengthLabel(kind, title)} onEdit={() => setEditing(true)} />
            <TitleTabs title={title} progressLabel={sectionLabel(kind, title)} onEdit={() => setEditing(true)} />
            <EditTitleDialog
                title={title}
                open={editing}
                onClose={() => setEditing(false)}
                onSave={saveEdits}
                onFetch={fetchFromSources}
                onUseArtwork={useArtwork}
                onArtworkOptions={artworkOptions}
                onUpload={uploadArtwork}
                onDelete={remove}
            />
            <NoteDialog
                open={noteMode !== null}
                heading={noteMode === "edit" ? "Edit your note" : `A note on ${title.title}`}
                initial={noteMode === "edit" && title.note ? { quote: title.note.quote, reflection: title.note.reflection ?? "" } : undefined}
                onClose={() => setNoteMode(null)}
                onSave={saveNote}
                onDelete={noteMode === "edit" ? deleteNote : undefined}
            />
            <RatingDialog
                open={rating}
                heading={`Rate ${title.title}`}
                initial={title.yourRating}
                allowClear
                onClose={() => setRating(false)}
                onSave={saveRating}
            />

            <div className="grid gap-10 pt-10 lg:grid-cols-[minmax(0,1fr)_23.5rem]">
                <div id="progress" className="flex flex-col gap-12">
                    {readsFirst && reviews}
                    <TitleCollection
                        kind={kind}
                        title={title}
                        progress={progress}
                        setProgress={(n) => saveProgress(n)}
                        onMilestonesChange={(list) => void api.put(`/media/${title.id}/milestones`, list)}
                        onEpisodesUpdated={reload}
                    />
                    {!readsFirst && reviews}
                    <CastSection mediaId={title.id} mediaTitle={title.title} />
                    <MediaGallery
                        owner="media"
                        id={title.id}
                        heading="Your gallery"
                        hint="Screenshots, scans, photos of your copy, fan art you love. Stored on your server."
                    />
                </div>
                <aside className="flex flex-col gap-6">
                    <JourneyCard
                        title={title}
                        journey={journey}
                        activeStatus={ACTIVE_STATUS[kind]}
                        onStatusChange={(label) => void api.put(`/media/${title.id}`, toRequest(title, media, { status: statusValue(label) })).then(reload)}
                        onRate={() => setRating(true)}
                    />
                    <TitleNote note={title.note} onWrite={() => setNoteMode("new")} onEdit={() => setNoteMode("edit")} />
                    <CollectionCard title={title} />
                    <TitleDetails title={title} />
                    <RelatedTitles related={title.related} />
                </aside>
            </div>
        </main>
    )
}
