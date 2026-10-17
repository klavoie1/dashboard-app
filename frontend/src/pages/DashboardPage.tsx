import { useEffect, useState } from "react";
import { api } from "../api";
import GreetingHeader from "../components/dashboardpage/GreetingHeader.tsx";

type MediaStatus = "want" | "in-progress" | "finished" | "paused" | "dropped";
type MediaKind = 'manga'| 'anime' | 'tv' | 'movie' | 'book' | 'light-novel' | 'game' | 'audiobook';
type Media = { id: number; title: string; kind: MediaKind; status: MediaStatus };

export default function DashboardPage() {
    const [media, setMedia] = useState<Media[]>([]);


    useEffect(() => {
        api.get<Media[]>("/media").then((r) => setMedia(r.data));
    }, []);

    return (
        <main className="mx-auto max-w-6xl p-6">

            <GreetingHeader />
            <ul className="mt-4 space-y-2">
                {media.map((m) => <li key={m.id}>{m.title} : {m.status}</li>)}
            </ul>
        </main>
    );
}
