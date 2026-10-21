import type {ProgressKind, Title} from "./titles.ts";

const HEADINGS: Record<ProgressKind, string> = {
    episodes: "Your episodes",
    runtime: "Your viewing",
    pages: "Your reading",
    listening: "Your listening",
    playtime: "Your playtime",
}

// Generic bar for now; each kind will swap in its own component (episode list, volumes, sessions…)
export default function TitleProgress({ title, kind }: { title: Title, kind: ProgressKind }) {
    const percent = title.total > 0 ? Math.min(100, (title.progress / title.total) * 100) : 0

    return (
        <section className="flex flex-col gap-4 rounded-xl bg-surface p-6">
            <h2 className="m-0 text-[12px] font-medium tracking-wider text-ink-muted uppercase">{HEADINGS[kind]}</h2>
            <div className="flex items-center gap-3">
                <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={title.total}
                    aria-valuenow={title.progress}
                    aria-label={`${title.title} progress`}
                    className="h-1.5 flex-1 overflow-hidden rounded bg-line"
                >
                    <div className="h-full rounded bg-accent" style={{ width: `${percent}%` }} />
                </div>
                <p className="m-0 text-[14px] text-ink-soft">{title.progress} / {title.total} {title.unit}</p>
            </div>
        </section>
    )
}
