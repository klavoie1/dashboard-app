import {type FormEvent, useState} from "react";
import SectionHeading from "./SectionHeading.tsx";
import {PRIMARY_BUTTON} from "./styles.ts";

export default function PageLog({ total, read, onChange }: { total: number, read: number, onChange: (n: number) => void }) {
    const [draft, setDraft] = useState("")

    function log(e: FormEvent) {
        e.preventDefault()
        if (draft === "") return
        onChange(Math.min(total, Math.max(0, Number(draft))))
        setDraft("")
    }

    return (
        <section className="flex flex-col gap-5">
            <SectionHeading title="The story, page by page" count={`${total} pages`} />
            <form onSubmit={log} className="flex flex-wrap items-center gap-4 rounded-xl bg-surface p-6">
                <label className="flex items-center gap-3 text-base text-ink-soft">
                    I’m on page
                    <input
                        type="number"
                        min={0}
                        max={total}
                        value={draft}
                        placeholder={String(read)}
                        onChange={(e) => setDraft(e.target.value)}
                        className="w-24 rounded-md border border-line bg-bg px-3 py-2 text-ink [color-scheme:dark] focus:border-accent focus:outline-none"
                    />
                    <span className="text-ink-muted">of {total}</span>
                </label>
                <button type="submit" className={PRIMARY_BUTTON}>Log pages</button>
            </form>
        </section>
    )
}
