import {type FormEvent, useEffect, useRef, useState} from "react";
import Icon from "../Icon.tsx";
import {coverOf, logProgress, progressText, typeOf, unitOf, type MediaSummary} from "../library/media.ts";

// "Log an update" from the dashboard: pick something in progress and say where you are
export default function LogUpdateDialog({ media, open, onClose, onSaved }: {
    media: MediaSummary[]
    open: boolean
    onClose: () => void
    onSaved: (m: MediaSummary) => void
}) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const choices = media.filter((m) => m.status === "in-progress" || m.status === "want")
    const [id, setId] = useState<number | null>(null)
    const [value, setValue] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const chosen = choices.find((m) => m.id === id) ?? choices[0]
    const game = chosen?.kind === "game"

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (open && !dialog.open) {
            setId(null)
            setValue("")
            setError(null)
            dialog.showModal()
        } else if (!open && dialog.open) {
            dialog.close()
        }
    }, [open])

    async function save(e: FormEvent) {
        e.preventDefault()
        if (!chosen || value === "") return
        const n = Number(value)
        setSaving(true)
        setError(null)
        try {
            // Games log hours played; everything else logs where you are now
            const updated = game ? await logProgress(chosen, chosen.progress, n) : await logProgress(chosen, n)
            onSaved(updated)
            onClose()
        } catch {
            setError(chosen.total ? `That’s past the end (${chosen.total}).` : "Couldn’t save that update.")
        } finally {
            setSaving(false)
        }
    }

    const unit = chosen ? (game ? "hours played" : unitOf(chosen) === "percent" ? "% complete" : unitOf(chosen)) : ""

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            aria-labelledby="log-update-heading"
            className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink [color-scheme:dark] backdrop:bg-black/70"
        >
            <form onSubmit={save} className="flex flex-col gap-5 p-6">
                <div className="flex items-center justify-between">
                    <h2 id="log-update-heading" className="m-0 font-serif text-[27px] font-normal">Log an update</h2>
                    <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink">
                        <Icon src="/x.svg" box="size-4.5" />
                    </button>
                </div>

                {choices.length === 0 ? (
                    <p className="m-0 text-base text-ink-muted">Nothing in progress or saved for later yet.</p>
                ) : (
                    <>
                        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted">
                            Title
                            <select
                                value={chosen?.id}
                                onChange={(e) => { setId(Number(e.target.value)); setValue("") }}
                                className="rounded-md border border-line bg-bg px-3 py-2 text-[15px] text-ink focus:border-accent focus:outline-none"
                            >
                                {choices.map((m) => <option key={m.id} value={m.id}>{m.title} · {typeOf(m)}</option>)}
                            </select>
                        </label>
                        {chosen && (
                            <div className="flex items-center gap-3">
                                <img src={coverOf(chosen)} alt="" className="h-16 w-11 rounded-[3px] object-cover" />
                                <p className="m-0 text-[14px] text-ink-soft">Now: {progressText(chosen)}</p>
                            </div>
                        )}
                        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted">
                            {game ? "Hours played" : `Where you are (${unit})`}
                            <input
                                type="number"
                                min={0}
                                step="any"
                                max={game ? undefined : chosen?.total ?? undefined}
                                required
                                value={value}
                                placeholder={String(game ? chosen?.hoursPlayed ?? 0 : chosen?.progress ?? 0)}
                                onChange={(e) => setValue(e.target.value)}
                                className="rounded-md border border-line bg-bg px-3 py-2 text-[15px] text-ink focus:border-accent focus:outline-none"
                            />
                        </label>
                    </>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3">
                    {error && <p role="alert" className="m-0 mr-auto text-[14px] text-ink">{error}</p>}
                    <button type="button" onClick={onClose} className="cursor-pointer rounded-md border border-line px-3 py-2 text-[14px] text-ink hover:border-accent">Cancel</button>
                    <button type="submit" disabled={saving || choices.length === 0} className="cursor-pointer rounded-md border border-accent bg-accent px-4 py-2 text-[14px] font-semibold text-bg hover:opacity-90 disabled:opacity-50">
                        {saving ? "Saving…" : "Save update"}
                    </button>
                </div>
            </form>
        </dialog>
    )
}
