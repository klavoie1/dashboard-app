import {useState} from "react";
import {api} from "../../../api.ts";
import {PROVIDER_NAMES, type Provider} from "../titles.ts";

type EpisodeUpdate = { added: number, updated: number, total: number, source: Provider | null, problems: Record<string, string> }

// "Update episodes", like Update cast: adds missing episodes from the linked sources and fills their details.
// Replacing also overwrites details you haven't locked; watched dates, ratings and notes are never touched.
export default function EpisodeUpdater({ mediaId, onUpdated }: { mediaId: number, onUpdated: () => Promise<void> }) {
    const [open, setOpen] = useState(false)
    const [replace, setReplace] = useState(false)
    const [busy, setBusy] = useState(false)
    const [note, setNote] = useState<string | null>(null)

    async function run() {
        setBusy(true)
        setNote(null)
        try {
            const { data } = await api.post<EpisodeUpdate>(`/media/${mediaId}/episodes/fetch`, null, { params: { replace } })
            await onUpdated()
            const problems = Object.values(data.problems).join(" ")
            setNote(data.source
                ? `${data.total} episodes from ${PROVIDER_NAMES[data.source]}: ${data.added} added, ${data.updated} updated.${problems ? ` ${problems}` : ""}`
                : problems || "No episode list found.")
        } catch {
            setNote("Couldn’t reach the server to update episodes.")
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
                <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="cursor-pointer text-[15px] text-ink-soft hover:text-accent">
                    Update episodes
                </button>
                {open && (
                    <>
                        <label className="flex cursor-pointer items-center gap-2 text-[14px] text-ink-soft">
                            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} className="size-4 accent-accent" />
                            Also replace details I haven’t locked
                        </label>
                        <button type="button" disabled={busy} onClick={() => void run()} className="cursor-pointer rounded-md border border-accent bg-accent px-3 py-1.5 text-[14px] font-semibold text-bg hover:opacity-90 disabled:opacity-50">
                            {busy ? "Updating…" : "Update now"}
                        </button>
                    </>
                )}
            </div>
            {note && <p role="status" className="m-0 text-[14px] text-ink-muted">{note}</p>}
        </div>
    )
}
