import { useEffect, useState } from "react";
import { api } from "../api";

type MediaStatus = "want" | "in-progress" | "finished" | "paused" | "dropped";
type Media = { id: number; title: string; kind: string; status: MediaStatus };

export default function DashboardPage() {
    const [media, setMedia] = useState<Media[]>([]);

    useEffect(() => {
        api.get<Media[]>("/media").then((r) => setMedia(r.data));
    }, []);

    return (
        <main className="mx-auto max-w-5xl p-6">
            <h1 className="text-3xl font-semibold">Dashboard</h1>
            <ul className="mt-4 space-y-1">
                {media.map((m) => <li key={m.id}>{m.title}</li>)}
            </ul>
        </main>
    );
}
