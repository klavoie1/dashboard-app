import LibraryOverview from "./LibraryOverview.tsx";
import CalendarCard from "./CalendarCard.tsx";
import JournalCard from "./JournalCard.tsx";


export default function PersonalSpace() {

    return (
        <section className="pt-10">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,520fr)_minmax(0,400fr)_minmax(0,616fr)]">
                <LibraryOverview />
                <CalendarCard />
                <JournalCard />
            </div>

        </section>
    )
}