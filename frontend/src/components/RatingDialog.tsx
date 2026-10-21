import {type FormEvent, useEffect, useRef, useState} from "react";
import Icon from "./Icon.tsx";

// Your own score out of 10, in half points
export default function RatingDialog({ open, heading, initial, allowClear, onClose, onSave }: {
    open: boolean
    heading: string
    initial?: number
    allowClear?: boolean
    onClose: () => void
    onSave: (rating: number | null) => Promise<void>
}) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [value, setValue] = useState(8)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (open && !dialog.open) {
            setValue(initial ?? 8)
            setError(null)
            dialog.showModal()
        } else if (!open && dialog.open) {
            dialog.close()
        }
    }, [open, initial])

    async function save(rating: number | null) {
        setBusy(true)
        setError(null)
        try {
            await onSave(rating)
            onClose()
        } catch {
            setError("Couldn’t save your rating.")
        } finally {
            setBusy(false)
        }
    }

    function submit(e: FormEvent) {
        e.preventDefault()
        void save(value)
    }

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            aria-labelledby="rating-dialog-heading"
            className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink [color-scheme:dark] backdrop:bg-black/70"
        >
            <form onSubmit={submit} className="flex flex-col gap-5 p-6">
                <h2 id="rating-dialog-heading" className="m-0 font-serif text-[27px] font-normal">{heading}</h2>
                <p className="m-0 flex items-baseline justify-center gap-2 text-ink" aria-hidden="true">
                    <Icon src="/icons/star.svg" box="size-6 self-center" className="text-accent" />
                    <span className="font-serif text-[52px] leading-none">{value.toFixed(1)}</span>
                    <span className="text-lg text-ink-muted">/ 10</span>
                </p>
                <label className="flex flex-col gap-2 text-[13px] font-medium text-ink-muted">
                    <span className="sr-only">Your rating out of 10</span>
                    <input
                        type="range"
                        min={1}
                        max={10}
                        step={0.5}
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        className="w-full accent-accent"
                    />
                    <span className="flex justify-between"><span>1</span><span>10</span></span>
                </label>
                <div className="flex flex-wrap items-center justify-end gap-3">
                    {allowClear && initial !== undefined && (
                        <button type="button" disabled={busy} onClick={() => void save(null)} className="mr-auto cursor-pointer text-[14px] text-ink-muted hover:text-ink">
                            Clear rating
                        </button>
                    )}
                    {error && <p role="alert" className="m-0 text-[14px] text-ink">{error}</p>}
                    <button type="button" onClick={onClose} className="cursor-pointer rounded-md border border-line px-3 py-2 text-[14px] text-ink hover:border-accent">Cancel</button>
                    <button type="submit" disabled={busy} className="cursor-pointer rounded-md border border-accent bg-accent px-4 py-2 text-[14px] font-semibold text-bg hover:opacity-90 disabled:opacity-50">
                        {busy ? "Saving…" : "Save rating"}
                    </button>
                </div>
            </form>
        </dialog>
    )
}
