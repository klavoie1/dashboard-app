import { useEffect, useState } from "react";
import { api } from "../api";

type MediaStatus = "want" | "in-progress" | "finished" | "paused" | "dropped";
type MediaKind = 'manga'| 'anime' | 'tv' | 'movie' | 'book' | 'light-novel' | 'game' | 'audiobook';
type Media = { id: number; title: string; kind: MediaKind; status: MediaStatus };

export default function DashboardPage() {
    const [media, setMedia] = useState<Media[]>([]);
    const date = new Date();
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;            // Monday = 1 ... Sunday = 7
    d.setUTCDate(d.getUTCDate() + 4 - day);    // jump to the Thursday of this week
    const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
    const dateFormat = date.toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    useEffect(() => {
        api.get<Media[]>("/media").then((r) => setMedia(r.data));
    }, []);

    return (
        <main className="mx-auto max-w-6xl p-6">
            <h1 className="text-3xl font-semibold">Hello, User!</h1>
            <p className="text-lg font-light">{dateFormat} • Week {week}</p>
            <ul className="mt-4 space-y-2">
                {media.map((m) => <li key={m.id}>{m.title} : {m.status}</li>)}
            </ul>
        </main>
    );
}
