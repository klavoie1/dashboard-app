import LibraryOverview from "./LibraryOverview.tsx";
import CalendarCard, {type Upcoming} from "./CalendarCard.tsx";
import JournalCard, {type RecentNote} from "./JournalCard.tsx";
import type {MediaSummary} from "../library/media.ts";


export default function PersonalSpace({ media, upcoming, notes, lastUpdate }: {
    media: MediaSummary[] | null
    upcoming: Upcoming[] | null
    notes: RecentNote[] | null
    lastUpdate: string | null
}) {

    return (
        <section className="pt-10">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,520fr)_minmax(0,400fr)_minmax(0,616fr)]">
                <LibraryOverview media={media} />
                <CalendarCard upcoming={upcoming} />
                <JournalCard note={notes === null ? undefined : notes[0] ?? null} lastUpdate={lastUpdate} />
            </div>

        </section>
    )
}
