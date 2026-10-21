import {useEffect, useRef, useState} from "react";
import {Link} from "react-router-dom";
import {api} from "../api.ts";
import Tooltip from "./Tooltip.tsx";

const ITEM = "flex w-full cursor-pointer items-center rounded px-3 py-2 text-left text-[15px] text-ink-soft transition-colors hover:bg-surface-raised hover:text-ink"

export default function AccountMenu({ initials }: { initials: string }) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Closes on a click outside or Escape
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

    async function logOut() {
        // axios sends the CSRF header Spring Security expects on POST /logout
        await api.post("/logout", null, { baseURL: "" }).catch(() => {})
        window.location.href = "/login"
    }

    return (
        <div ref={ref} className="relative">
            <Tooltip label="Account" side="bottom" align="end">
                <button
                    type="button"
                    aria-label="Account menu"
                    aria-haspopup="menu"
                    aria-expanded={open}
                    onClick={() => setOpen((v) => !v)}
                    className="flex size-8.5 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-accent-soft p-0 text-[11px] font-semibold text-accent"
                >
                    {initials}
                </button>
            </Tooltip>
            {open && (
                <div role="menu" className="absolute top-full right-0 z-40 mt-2 flex w-48 flex-col rounded-md bg-surface p-1 shadow-lg ring-1 ring-line">
                    <Link role="menuitem" to="/settings" onClick={() => setOpen(false)} className={ITEM}>Settings</Link>
                    <button role="menuitem" type="button" onClick={logOut} className={ITEM}>Log out</button>
                </div>
            )}
        </div>
    )
}
