import {useEffect, useState} from "react";
import {api} from "../api.ts";
import GreetingHeader from "../components/dashboardpage/GreetingHeader.tsx";
import FeaturedCarousel from "../components/dashboardpage/FeaturedCarousel.tsx";
import PersonalOverview from "../components/dashboardpage/PersonalOverview.tsx"
import ContinueStories from "../components/dashboardpage/ContinueStories.tsx";
import PersonalSpace from "../components/dashboardpage/PersonalSpace.tsx";
import PersonalDiscovery from "../components/dashboardpage/PersonalDiscovery.tsx";
import LogUpdateDialog from "../components/dashboardpage/LogUpdateDialog.tsx";
import type {Upcoming} from "../components/dashboardpage/CalendarCard.tsx";
import type {RecentNote} from "../components/dashboardpage/JournalCard.tsx";
import {displayName, useMe} from "../components/useMe.ts";
import {loadLibrary, logProgress, progressText, quickStep, shortDay, type MediaSummary} from "../components/library/media.ts";

export default function DashboardPage() {
    // null while loading; each section shows its own empty state once loaded
    const [media, setMedia] = useState<MediaSummary[] | null>(null)
    const [upcoming, setUpcoming] = useState<Upcoming[] | null>(null)
    const [notes, setNotes] = useState<RecentNote[] | null>(null)
    const [logging, setLogging] = useState(false)
    const me = useMe()

    useEffect(() => {
        void loadLibrary().then(setMedia).catch(() => setMedia([]))
        void api.get<Upcoming[]>("/media/upcoming", { params: { limit: 3 } }).then((r) => setUpcoming(r.data)).catch(() => setUpcoming([]))
        void api.get<RecentNote[]>("/journal/recent", { params: { limit: 1 } }).then((r) => setNotes(r.data)).catch(() => setNotes([]))
    }, [])

    // One updated title flows into every section at once
    function replace(updated: MediaSummary) {
        setMedia((list) => list?.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)) ?? null)
    }

    async function quickLog(m: MediaSummary) {
        const step = quickStep(m)
        if (!step) return
        replace(await logProgress(m, step.progress, step.hours))
    }

    const latest = media?.filter((m) => m.lastActivityOn).sort((a, b) => b.lastActivityOn!.localeCompare(a.lastActivityOn!))[0]
    const lastUpdate = latest ? `${shortDay(latest.lastActivityOn)} · ${latest.title} · ${progressText(latest)}` : null

    return (
        <main>
            <GreetingHeader userName={me ? displayName(me) : undefined} onLogUpdate={() => setLogging(true)} />
            <FeaturedCarousel media={media} onLog={(m) => void quickLog(m)} />
            <PersonalOverview media={media} />
            <ContinueStories media={media} onLog={(m) => void quickLog(m)} />
            <PersonalSpace media={media} upcoming={upcoming} notes={notes} lastUpdate={lastUpdate} />
            <PersonalDiscovery />
            <LogUpdateDialog media={media ?? []} open={logging} onClose={() => setLogging(false)} onSaved={replace} />
        </main>
    );
}
