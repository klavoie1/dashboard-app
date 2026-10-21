import SectionHeading from "./SectionHeading.tsx";
import {formatMinutes, SECONDARY_BUTTON} from "./styles.ts";

// Movies: either watched, or paused partway through
export default function RuntimeLog({ total, watched, onChange }: { total: number, watched: number, onChange: (n: number) => void }) {
    const finished = watched >= total

    return (
        <section className="flex flex-col gap-5">
            <SectionHeading title="Your viewing" count={`Runtime ${formatMinutes(total)}`} />
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-surface p-6">
                {finished ? (
                    <>
                        <p className="m-0 mr-auto text-base text-ink-soft">You’ve watched this one.</p>
                        <button type="button" onClick={() => onChange(0)} className={SECONDARY_BUTTON}>Mark unwatched</button>
                    </>
                ) : (
                    <label className="flex items-center gap-3 text-base text-ink-soft">
                        Stopped at
                        <input
                            type="number"
                            min={0}
                            max={total}
                            value={watched}
                            onChange={(e) => onChange(Math.min(total, Math.max(0, Number(e.target.value))))}
                            className="w-20 rounded-md border border-line bg-bg px-3 py-2 text-ink [color-scheme:dark] focus:border-accent focus:outline-none"
                        />
                        <span className="text-ink-muted">of {total} min</span>
                    </label>
                )}
            </div>
        </section>
    )
}
