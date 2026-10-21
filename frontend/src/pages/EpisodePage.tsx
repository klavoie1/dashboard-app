import {useState} from "react";
import {useParams} from "react-router-dom";
import {api} from "../api.ts";
import {episodeAt, PROGRESS_KIND, type EpisodeRef, type Title} from "../components/mediapage/titles.ts";
import {useTitle} from "../components/mediapage/useTitle.ts";
import TitleStatus from "../components/mediapage/TitleStatus.tsx";
import NoteDialog, {type NoteDraft} from "../components/NoteDialog.tsx";
import RatingDialog from "../components/RatingDialog.tsx";
import EditEpisodeDialog from "../components/episodepage/EditEpisodeDialog.tsx";
import EpisodeHero from "../components/episodepage/EpisodeHero.tsx";
import EpisodeToolbar from "../components/episodepage/EpisodeToolbar.tsx";
import EpisodeSummary from "../components/episodepage/EpisodeSummary.tsx";
import EpisodeScreenshots from "../components/episodepage/EpisodeScreenshots.tsx";
import EpisodeNote from "../components/episodepage/EpisodeNote.tsx";
import YourEpisodeCard from "../components/episodepage/YourEpisodeCard.tsx";
import CommunityCard from "../components/episodepage/CommunityCard.tsx";
import SeriesProgressCard from "../components/episodepage/SeriesProgressCard.tsx";
import EpisodeNav from "../components/episodepage/EpisodeNav.tsx";

// Anime and TV share this page; episode numbers count across the whole show
export default function EpisodePage() {
    const {id, episode} = useParams()
    const {state, reload} = useTitle(Number(id))

    if (state.status !== "ready") return <TitleStatus status={state.status} />
    const title = state.title
    const ep = PROGRESS_KIND[title.type] === "episodes" ? episodeAt(title, Number(episode)) : null
    if (!ep) return <TitleStatus status="missing" backTo={{ to: `/library/${title.id}`, label: `Back to ${title.title}` }} />

    // key resets local tracking when moving between episodes
    return <EpisodeView key={`${title.id}-${ep.overall}`} title={title} ep={ep} reload={reload} />
}

function EpisodeView({ title, ep, reload }: { title: Title, ep: EpisodeRef, reload: () => Promise<void> }) {
    const [writing, setWriting] = useState(false)
    const [rating, setRating] = useState(false)
    const [editing, setEditing] = useState(false)
    // Shown straight away, then saved; a failed save puts the old value back
    const [progress, setProgressState] = useState(title.progress)

    function setProgress(next: number) {
        const before = progress
        setProgressState(next)
        api.patch(`/media/${title.id}/progress`, { progress: next }).catch(() => setProgressState(before))
    }
    const info = title.episodeInfo?.[ep.overall] ?? {}
    const watched = ep.overall <= progress
    const seriesLink = `/library/${title.id}${ep.season ? `?season=${ep.season}` : ""}`
    const shots = info.screenshots ?? []
    // Episodes only exist on the server once they're imported or added
    const stored = info.episodeId !== undefined

    async function saveNote(note: NoteDraft) {
        const body = { episodeId: info.episodeId, quote: note.quote, reflection: note.reflection || null }
        if (info.note?.id) await api.put(`/journal/${info.note.id}`, { ...body, writtenOn: info.note.date })
        else await api.post(`/media/${title.id}/journal`, body)
        await reload()
    }

    async function deleteNote() {
        await api.delete(`/journal/${info.note!.id}`)
        await reload()
    }

    async function saveRating(value: number | null) {
        if (value === null) return
        await api.patch(`/media/${title.id}/episodes/${ep.overall}`, { rating: value })
        await reload()
    }

    return (
        <main className="pb-12">
            <EpisodeHero title={title} ep={ep} artwork={shots[0]?.src} />
            <EpisodeToolbar seriesLink={seriesLink} total={title.total} hasScreenshots={shots.length > 0 || stored} onEdit={stored ? () => setEditing(true) : undefined} />

            <div className="grid gap-10 pt-10 pb-12 lg:grid-cols-[minmax(0,1fr)_23.5rem]">
                <div className="flex flex-col gap-10">
                    <EpisodeSummary info={info} watched={watched} />
                    {(shots.length > 0 || stored) && <EpisodeScreenshots shots={shots} watched={watched} onAdd={stored ? () => setEditing(true) : undefined} />}
                    <EpisodeNote note={info.note} episode={ep.number} onEdit={stored ? () => setWriting(true) : undefined} />
                </div>
                <aside className="flex flex-col gap-6">
                    {/* Watching marks everything before it too; unwatching steps progress back to just before it */}
                    <YourEpisodeCard
                        info={info}
                        watched={watched}
                        onWatchedChange={(w) => setProgress(w ? Math.max(progress, ep.overall) : ep.overall - 1)}
                        // Only episodes the server knows about can store their own tracking
                        onChange={stored ? (patch) => void api.patch(`/media/${title.id}/episodes/${ep.overall}`, patch) : undefined}
                        onRate={stored ? () => setRating(true) : undefined}
                    />
                    <CommunityCard info={info} />
                    <SeriesProgressCard title={title} progress={progress} />
                </aside>
            </div>

            <EpisodeNav title={title} overall={ep.overall} progress={progress} seriesLink={seriesLink} />
            <NoteDialog
                open={writing}
                heading={info.note ? "Edit your note" : `A note on episode ${ep.number}`}
                initial={info.note ? { quote: info.note.quote, reflection: info.note.reflection ?? "" } : undefined}
                onClose={() => setWriting(false)}
                onSave={saveNote}
                onDelete={info.note?.id ? deleteNote : undefined}
            />
            {stored && (
                <EditEpisodeDialog mediaId={title.id} ep={ep} info={info} open={editing} onClose={() => setEditing(false)} onChanged={reload} />
            )}
            <RatingDialog
                open={rating}
                heading={`Rate “${ep.title}”`}
                initial={info.yourRating}
                onClose={() => setRating(false)}
                onSave={saveRating}
            />
        </main>
    )
}
