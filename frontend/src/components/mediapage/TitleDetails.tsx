import type {Title} from "./titles.ts";

export default function TitleDetails({ title }: { title: Title }) {
    return (
        <section className="flex flex-col gap-5 rounded-xl bg-surface p-6">
            <h2 className="m-0 text-[12px] font-medium tracking-wider text-ink-muted uppercase">Details</h2>
            <dl className="m-0 flex flex-col gap-3">
                <div className="flex justify-between gap-4">
                    <dt className="text-[14px] text-ink-muted">Released</dt>
                    <dd className="m-0 text-right text-[14px] text-ink">{title.year}</dd>
                </div>
                {title.details.map((d) => (
                    <div key={d.label} className="flex justify-between gap-4">
                        <dt className="text-[14px] text-ink-muted">{d.label}</dt>
                        <dd className="m-0 text-right text-[14px] text-ink">{d.value}</dd>
                    </div>
                ))}
            </dl>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {title.tags.map((tag) => (
                    <li key={tag} className="rounded-full border border-line px-3 py-1 text-[13px] text-ink-soft">{tag}</li>
                ))}
            </ul>
        </section>
    )
}
