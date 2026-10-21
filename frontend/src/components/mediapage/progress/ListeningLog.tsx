import SectionHeading from "./SectionHeading.tsx";
import {formatMinutes, SECONDARY_BUTTON} from "./styles.ts";

const STEPS = [15, 30, 60]

export default function ListeningLog({ total, listened, onChange }: { total: number, listened: number, onChange: (n: number) => void }) {
    return (
        <section className="flex flex-col gap-5">
            <SectionHeading title="Listening, minute by minute" count={formatMinutes(total)} />
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface p-6">
                <p className="m-0 mr-auto text-base text-ink-soft">
                    {listened >= total ? "Finished" : `${formatMinutes(listened)} in · ${formatMinutes(total - listened)} left`}
                </p>
                {STEPS.map((step) => (
                    <button
                        key={step}
                        type="button"
                        disabled={listened >= total}
                        onClick={() => onChange(Math.min(total, listened + step))}
                        aria-label={`Log ${step} minutes listened`}
                        className={`${SECONDARY_BUTTON} disabled:cursor-default disabled:opacity-40`}
                    >
                        +{formatMinutes(step)}
                    </button>
                ))}
            </div>
        </section>
    )
}
