import GreetingHeader from "../components/dashboardpage/GreetingHeader.tsx";
import FeaturedCarousel from "../components/dashboardpage/FeaturedCarousel.tsx";
import PersonalOverview from "../components/dashboardpage/PersonalOverview.tsx"
import ContinueStories from "../components/dashboardpage/ContinueStories.tsx";
import PersonalSpace from "../components/dashboardpage/PersonalSpace.tsx";
import PersonalDiscovery from "../components/dashboardpage/PersonalDiscovery.tsx";

export default function DashboardPage() {


    return (
        <main>
            <GreetingHeader />
            <FeaturedCarousel />
            <PersonalOverview />
            <ContinueStories />
            <PersonalSpace />
            <PersonalDiscovery />
        </main>
    );
}
