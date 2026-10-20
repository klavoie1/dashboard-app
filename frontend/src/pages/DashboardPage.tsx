import GreetingHeader from "../components/dashboardpage/GreetingHeader.tsx";
import FeaturedJourney from "../components/dashboardpage/FeaturedJourney.tsx";
import PersonalOverview from "../components/dashboardpage/PersonalOverview.tsx"


export default function DashboardPage() {


    return (
        <main>
            <GreetingHeader />
            {/* Placeholder until this comes from the API */}
            <FeaturedJourney
                title="Frieren"
                subtitle="Beyond Journey’s End"
                artwork="/featured/frieren.jpg"
                artworkPosition="50% 25%"
                nextUp="Up next: 07 · Like a Fairy Tale  ·  24 min"
                progress={6}
                total={28}
                unit="episodes watched"
                actionLabel="Mark episode 7 watched"
                viewLabel="View anime"
                viewTo="/library"
                status="IN YOUR LIBRARY · WATCHING"
            />
            <PersonalOverview />
        </main>
    );
}
