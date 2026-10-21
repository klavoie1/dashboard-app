import type {Title} from "./titles.ts";

export default function TitleDetails({ title }: { title: Title }) {
    const rows = [
        ...(title.originalTitle ? [{ label: "Original title", value: title.originalTitle }] : []),
        ...title.details,
    ]

    return (
        <section id="details" className="flex flex-col gap-4.5 p-6">
            <h2 className="m-0 text-[13px] font-semibold text-ink-muted uppercase">The details</h2>
            <dl className="m-0 flex flex-col gap-4.5">
                {rows.map((d) => (
                    <div key={d.label} className="flex justify-between gap-4 text-[14px]">
                        <dt className="text-ink-muted">{d.label}</dt>
                        <dd className="m-0 text-right text-ink-soft">{d.value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    )
}
