import {api} from "../api.ts";
import {useEffect, useState} from "react";

type MediaStatus = "want" | "in-progress" | "finished" | "paused" | "dropped";
type MediaKind = 'manga'| 'anime' | 'tv' | 'movie' | 'book' | 'light-novel' | 'game' | 'audiobook';
type Media = { id: number; title: string; kind: MediaKind; status: MediaStatus };

export default function LibraryPage() {
    const [media, setMedia] = useState<Media[]>([]);


    useEffect(() => {
        api.get<Media[]>("/media").then((r) => setMedia(r.data));
    }, []);

    return (
    <main className="mx-auto max-w-6xl p-6">

        <h1 className="p-6 text-3xl font-semibold">Library</h1>
        <ul className="mt-4 space-y-2">
            {media.map((m) => <li key={m.id}>{m.title} : {m.status}</li>)}
        </ul>
    </main>
    );
}