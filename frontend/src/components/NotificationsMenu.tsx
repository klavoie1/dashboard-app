import {useEffect, useRef, useState} from "react";
import {Link} from "react-router-dom";
import {api} from "../api.ts";
import Icon from "./Icon.tsx";
import Tooltip from "./Tooltip.tsx";
import type {Upcoming} from "./dashboardpage/CalendarCard.tsx";
import {episodePath} from "./mediapage/titles.ts";

const WINDOW_DAYS = 14

function when(iso: string) {
    const days = Math.round((new Date(`${iso}T00:00`).getTime() - new Date(new Date().toDateString()).getTime()) / 86_400_000)
    if (days <= 0) return "Today"
    if (days === 1) return "Tomorrow"
    return new Date(`${iso}T00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
}

// The bell: new episodes of shows you're following, over the next two weeks
export default function NotificationsMenu() {
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState<Upcoming[] | null>(null)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        void api.get<Upcoming[]>("/media/upcoming", { params: { limit: 12 } }).then((r) => {
            const cutoff = new Date(Date.now() + WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10)
            setItems(r.data.filter((u) => u.airDate <= cutoff))
        }).catch(() => setItems([]))
    }, [])

    useEffect(() => {
        if (!open) return
        const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
        document.addEventListener("mousedown", onClick)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("mousedown", onClick)
            document.removeEventListener("keydown", onKey)
        }
    }, [open])

    const count = items?.length ?? 0
    return (
        <div ref={ref} className="relative">
            <Tooltip label="Coming up" side="bottom">
                <button
                    type="button"
                    aria-label={count ? `${count} episodes coming up` : "Notifications"}
                    aria-haspopup="true"
                    aria-expanded={open}
                    onClick={() => setOpen((v) => !v)}
                    className="relative flex cursor-pointer rounded border-0 bg-transparent p-0"
                >
                    <Icon src="/notifications.svg" box="size-[19px]" className="text-ink-muted transition-colors hover:text-ink" />
                    {count > 0 && <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 block size-2 rounded-full bg-accent" />}
                </button>
            </Tooltip>
            {open && (
                <div className="absolute top-full right-0 z-40 mt-2 flex w-80 flex-col gap-1 rounded-md bg-surface p-2 shadow-lg ring-1 ring-line">
                    <p className="m-0 px-2 pt-1 pb-2 text-[13px] font-semibold text-ink-muted uppercase">Coming up</p>
                    {count === 0 && <p className="m-0 px-2 pb-2 text-[14px] text-ink-muted">Nothing airing in the next two weeks for shows you’re following.</p>}
                    {items?.map((u) => (
                        <Link
                            key={`${u.mediaId}-${u.number}`}
                            to={episodePath(u.mediaId, u.number)}
                            onClick={() => setOpen(false)}
                            className="flex flex-col gap-0.5 rounded px-2 py-2 transition-colors hover:bg-surface-raised"
                        >
                            <span className="text-[15px] text-ink">{u.mediaTitle}</span>
                            <span className="text-[13px] text-ink-muted">
                                {when(u.airDate)} · {u.season ? `S${u.season} · ` : ""}Episode {u.seasonNumber ?? u.number}{u.title ? ` · ${u.title}` : ""}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
