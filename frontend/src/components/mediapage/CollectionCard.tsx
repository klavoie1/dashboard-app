import type {Title} from "./titles.ts";

const LONG_DATE: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
const formatDate = (iso: string) => new Date(`${iso}T00:00`).toLocaleDateString('en-US', LONG_DATE)

export default function CollectionCard({ title }: { title: Title }) {
    const rows = [
        title.started && { label: "Started", value: formatDate(title.started) },
        title.lastActivity && { label: "Last activity", value: formatDate(title.lastActivity) },
        title.rewatches !== undefined && { label: "Revisits", value: String(title.rewatches) },
    ].filter((r): r is { label: string, value: string } => Boolean(r))
    if (rows.length === 0) return null

    return (
        <section className="flex flex-col gap-4.5 rounded-xl border border-line p-6">
            <h2 className="m-0 text-[13px] font-semibold text-ink-muted uppercase">In your collection</h2>
            <dl className="m-0 flex flex-col gap-4.5">
                {rows.map((r) => (
                    <div key={r.label} className="flex justify-between gap-4 text-[14px]">
                        <dt className="text-ink-muted">{r.label}</dt>
                        <dd className="m-0 text-ink-soft">{r.value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    )
}
