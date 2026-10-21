export default function SectionHeading({ title, count }: { title: string, count?: string }) {
    return (
        <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="m-0 font-serif text-3xl font-normal text-ink">{title}</h2>
            {count && <p className="m-0 text-[15px] text-ink-muted">{count}</p>}
        </div>
    )
}
