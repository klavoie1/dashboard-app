import {useSearchParams} from "react-router-dom";
import {episodePath, locateEpisode, seasonOffset, type ProgressKind, type Title} from "./titles.ts";
import SeasonPicker from "./progress/SeasonPicker.tsx";
import EpisodeUpdater from "./progress/EpisodeUpdater.tsx";
import {countsVolumes} from "./progress/journey.ts";
import UnitList from "./progress/UnitList.tsx";
import PageLog from "./progress/PageLog.tsx";
import ListeningLog from "./progress/ListeningLog.tsx";
import Milestones from "./progress/Milestones.tsx";
import RuntimeLog from "./progress/RuntimeLog.tsx";

const SHORT_DATE: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
const DAY_MS = 24 * 60 * 60 * 1000

const shortDate = (iso: string) => new Date(`${iso}T00:00`).toLocaleDateString('en-US', SHORT_DATE)

// Weekly air date for episode n, counted from the first one
const airDate = (firstAired: string | undefined, n: number) =>
    firstAired ? new Date(new Date(`${firstAired}T00:00`).getTime() + (n - 1) * 7 * DAY_MS).toLocaleDateString('en-US', SHORT_DATE) : null

// Main-column section for how this kind of media is tracked
export default function TitleCollection(props: CollectionProps) {
    if (props.kind === "episodes" && props.title.seasons) return <SeasonedEpisodes {...props} />
    return <Collection {...props} />
}

type CollectionProps = {
    kind: ProgressKind
    title: Title
    progress: number
    setProgress: (n: number) => void
    onMilestonesChange?: (milestones: { label: string, done: boolean }[]) => void
    // Reloads the title after episodes were updated from the sources
    onEpisodesUpdated?: () => Promise<void>
}

// TV: one page, the season lives in the URL so Back, refresh and shared links keep it
function SeasonedEpisodes({ title, progress, setProgress, onEpisodesUpdated }: CollectionProps) {
    const seasons = title.seasons!
    const [params, setParams] = useSearchParams()
    // Defaults to the season holding your next episode
    const current = locateEpisode(seasons, Math.min(progress + 1, title.total))?.season.number ?? 1
    const picked = Number(params.get("season"))
    const season = seasons.find((s) => s.number === picked) ?? seasons.find((s) => s.number === current)!
    const offset = seasonOffset(seasons, season.number)
    const count = season.episodes.length

    return (
        <UnitList
            // Remount so filters and paging reset per season
            key={season.number}
            heading="The journey, episode by episode"
            countLabel={`Season ${season.number}  ·  ${count} episodes`}
            controls={
                <>
                    {onEpisodesUpdated && <EpisodeUpdater mediaId={title.id} onUpdated={onEpisodesUpdated} />}
                    <SeasonPicker
                        label="Seasons"
                        options={seasons.map((s) => ({
                            label: `Season ${s.number}`,
                            active: s.number === season.number,
                            onSelect: () => setParams({ season: String(s.number) }),
                        }))}
                    />
                </>
            }
            noun="Episode"
            total={count}
            done={Math.max(0, Math.min(count, progress - offset))}
            onChange={(n) => setProgress(offset + n)}
            hrefFor={(n) => episodePath(title.id, offset + n)}
            doneLabel="Watched"
            todoLabel="Unwatched"
            titleFor={(n) => season.episodes[n - 1].title}
            metaFor={(n) => {
                const { minutes, aired } = season.episodes[n - 1]
                return [aired ? shortDate(aired) : airDate(season.firstAired, n), minutes && `${minutes} min`].filter(Boolean).join("  ·  ") || undefined
            }}
        />
    )
}

function Collection({ kind, title, progress, setProgress, onMilestonesChange, onEpisodesUpdated }: CollectionProps) {
    switch (kind) {
        case "episodes": {
            return (
                <UnitList
                    // Anime seasons are separate entries, so the picker links between them
                    controls={
                        <>
                            {onEpisodesUpdated && <EpisodeUpdater mediaId={title.id} onUpdated={onEpisodesUpdated} />}
                            {title.franchise && (
                                <SeasonPicker
                                    label="Seasons"
                                    options={title.franchise.map((f) => ({ label: f.label, to: `/library/${f.id}`, active: f.id === title.id }))}
                                />
                            )}
                        </>
                    }
                    heading="The journey, episode by episode"
                    noun="Episode"
                    hrefFor={(n) => episodePath(title.id, n)}
                    total={title.total}
                    done={progress}
                    onChange={setProgress}
                    doneLabel="Watched"
                    todoLabel="Unwatched"
                    titleFor={(n) => title.episodeTitles?.[n] ?? `Episode ${n}`}
                    metaFor={(n) => [title.episodeAired?.[n] ? shortDate(title.episodeAired[n]) : airDate(title.firstAired, n), title.episodeMinutes && `${title.episodeMinutes} min`].filter(Boolean).join("  ·  ") || undefined}
                />
            )
        }
        case "pages":
            return countsVolumes(title) ? (
                <UnitList
                    heading="The story, volume by volume"
                    noun="Volume"
                    total={title.total}
                    done={progress}
                    onChange={setProgress}
                    doneLabel="Read"
                    todoLabel="Unread"
                    titleFor={(n) => `Volume ${n}`}
                    thumbnail={title.cover}
                />
            ) : (
                <PageLog total={title.total} read={progress} onChange={setProgress} />
            )
        case "listening":
            return <ListeningLog total={title.total} listened={progress} onChange={setProgress} />
        case "playtime":
            return <Milestones initial={title.milestones ?? []} onChange={onMilestonesChange} />
        case "runtime":
            return <RuntimeLog total={title.total} watched={progress} onChange={setProgress} />
    }
}
