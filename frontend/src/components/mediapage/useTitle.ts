import {useCallback, useEffect, useState} from "react";
import {isAxiosError} from "axios";
import {loadTitle, type MediaDetail} from "./titleApi.ts";
import type {Title} from "./titles.ts";

type TitleState =
    | { status: "loading" }
    | { status: "missing" }
    | { status: "error" }
    | { status: "ready", media: MediaDetail, title: Title }

async function fetchState(id: number): Promise<TitleState> {
    try {
        return { status: "ready", ...(await loadTitle(id)) }
    } catch (e) {
        return { status: isAxiosError(e) && (e.response?.status === 404 || e.response?.status === 400) ? "missing" : "error" }
    }
}

// Loads one title with its episodes and notes; reload after saving to pick up server changes
export function useTitle(id: number) {
    const [state, setState] = useState<TitleState>({ status: "loading" })

    useEffect(() => {
        // Ignores a slow answer for a title you've already navigated away from
        let current = true
        void fetchState(id).then((s) => current && setState(s))
        return () => { current = false }
    }, [id])

    const reload = useCallback(async () => setState(await fetchState(id)), [id])

    return { state, reload }
}
