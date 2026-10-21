import {useState} from "react";
import Icon from "../../Icon.tsx";
import SectionHeading from "./SectionHeading.tsx";

type MilestoneList = { label: string, done: boolean }[]

export default function Milestones({ initial, onChange }: { initial: MilestoneList, onChange?: (list: MilestoneList) => void }) {
    const [milestones, setMilestones] = useState(initial)
    const done = milestones.filter((m) => m.done).length

    function toggle(i: number) {
        const next = milestones.map((m, j) => (j === i ? { ...m, done: !m.done } : m))
        setMilestones(next)
        onChange?.(next)
    }

    return (
        <section className="flex flex-col gap-5">
            <SectionHeading title="Milestones along the way" count={`${done} of ${milestones.length}`} />
            {milestones.length === 0 ? (
                <p className="m-0 text-base text-ink-muted">No milestones yet.</p>
            ) : (
                <ol className="m-0 flex list-none flex-col gap-1 p-0">
                    {milestones.map((m, i) => (
                        <li key={m.label} className="flex min-h-16 items-center gap-3.5 border-b border-line bg-surface px-4">
                            <button
                                type="button"
                                aria-pressed={m.done}
                                aria-label={m.label}
                                onClick={() => toggle(i)}
                                className={`flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors ${
                                    m.done ? "border-accent bg-accent text-bg" : "border-ink-muted hover:border-accent"
                                }`}
                            >
                                {m.done && <Icon src="/featured/check.svg" box="size-3.5" />}
                            </button>
                            <p className={`m-0 flex-1 text-base ${m.done ? "text-ink-soft" : "font-semibold text-ink"}`}>{m.label}</p>
                            <p className="m-0 text-[14px] text-ink-muted">{m.done ? "Reached" : "Ahead"}</p>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    )
}
