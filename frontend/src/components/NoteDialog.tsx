import {type FormEvent, useEffect, useRef, useState} from "react";
import Icon from "./Icon.tsx";

export type NoteDraft = { quote: string, reflection: string }

// Writes or edits a private journal note; used on title and episode pages
export default function NoteDialog({ open, heading, initial, onClose, onSave, onDelete }: {
    open: boolean
    heading: string
    initial?: NoteDraft
    onClose: () => void
    onSave: (note: NoteDraft) => Promise<void>
    onDelete?: () => Promise<void>
}) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [quote, setQuote] = useState("")
    const [reflection, setReflection] = useState("")
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (open && !dialog.open) {
            setQuote(initial?.quote ?? "")
            setReflection(initial?.reflection ?? "")
            setError(null)
            dialog.showModal()
        } else if (!open && dialog.open) {
            dialog.close()
        }
    }, [open, initial])

    async function run(action: () => Promise<void>) {
        setBusy(true)
        setError(null)
        try {
            await action()
            onClose()
        } catch {
            setError("Couldn’t save your note. Try again.")
        } finally {
            setBusy(false)
        }
    }

    function save(e: FormEvent) {
        e.preventDefault()
        void run(() => onSave({ quote: quote.trim(), reflection: reflection.trim() }))
    }

    const field = "w-full rounded-md border border-line bg-bg px-3 py-2 text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            aria-labelledby="note-dialog-heading"
            className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink [color-scheme:dark] backdrop:bg-black/70"
        >
            <form onSubmit={save} className="flex flex-col gap-5 p-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 id="note-dialog-heading" className="m-0 font-serif text-[27px] font-normal">{heading}</h2>
                        <p className="m-0 flex items-center gap-1.5 text-[13px] text-ink-muted">
                            <Icon src="/space-icons/lock-keyhole.svg" box="size-3" />
                            Only you can see this. It stays on your server.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink">
                        <Icon src="/x.svg" box="size-4.5" />
                    </button>
                </div>
                <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted">
                    The line to remember
                    <textarea required rows={2} value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="A thought, a quote, a feeling" className={`${field} resize-y font-serif text-[20px] leading-[1.35]`} />
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-muted">
                    More thoughts (optional)
                    <textarea rows={4} value={reflection} onChange={(e) => setReflection(e.target.value)} className={`${field} resize-y text-[15px] leading-relaxed`} />
                </label>
                <div className="flex flex-wrap items-center justify-end gap-3">
                    {onDelete && (
                        <button type="button" disabled={busy} onClick={() => void run(onDelete)} className="mr-auto cursor-pointer text-[14px] text-ink-muted hover:text-ink disabled:opacity-50">
                            Delete note
                        </button>
                    )}
                    {error && <p role="alert" className="m-0 text-[14px] text-ink">{error}</p>}
                    <button type="button" onClick={onClose} className="cursor-pointer rounded-md border border-line px-3 py-2 text-[14px] text-ink hover:border-accent">Cancel</button>
                    <button type="submit" disabled={busy} className="cursor-pointer rounded-md border border-accent bg-accent px-4 py-2 text-[14px] font-semibold text-bg hover:opacity-90 disabled:opacity-50">
                        {busy ? "Saving…" : "Save note"}
                    </button>
                </div>
            </form>
        </dialog>
    )
}
