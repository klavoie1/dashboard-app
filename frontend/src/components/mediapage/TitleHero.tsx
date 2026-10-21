import type {Title} from "./titles.ts";
import TitleRatings from "./TitleRatings.tsx";

const ACTION_BUTTON = "flex cursor-pointer items-center gap-2 rounded-md border px-3.5 py-2.75 text-[15px] font-semibold transition-colors"

export default function TitleHero({ title, onUpdate, onEdit }: { title: Title, onUpdate?: () => void, onEdit?: () => void }) {
    const backdrop = title.backdrop ?? title.cover

    return (
        <section className="relative -mx-4 flex min-h-96 items-end overflow-hidden px-4 pt-24 pb-10 md:mx-0 md:rounded-xl md:px-8 xl:px-12">
            {/* A cover without wide artwork is blurred to fill the frame */}
            <img
                src={backdrop}
                alt=""
                className={`absolute inset-0 size-full object-cover ${title.backdrop ? "" : "scale-110 blur-2xl brightness-50"}`}
                style={{ objectPosition: title.backdropPosition }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/80 to-bg/10" />

            <div className="relative flex w-full flex-col gap-6 md:flex-row md:items-end md:gap-8">
                <img src={title.cover} alt="" className="w-36 rounded-md shadow-2xl md:w-48" />

                <div className="flex flex-col items-start gap-3">
                    <p className="m-0 flex items-center gap-2.5 text-[13px] font-semibold text-accent uppercase">
                        <span aria-hidden="true" className="block h-0.5 w-7 bg-accent" />
                        {title.type}
                    </p>
                    <h1 className="m-0 flex flex-col font-serif font-normal text-ink">
                        <span className="text-5xl leading-[1.05] md:text-[64px]">{title.title}</span>
                        {title.subtitle && <span className="text-[24px] leading-normal">{title.subtitle}</span>}
                    </h1>
                    <p className="m-0 text-base text-ink-soft">{title.creator} · {title.year}</p>
                    <TitleRatings title={title} />
                    <p className="m-0 flex items-center gap-2 text-[13px] text-ink uppercase">
                        <span aria-hidden="true" className="block size-1.25 rounded-full bg-accent" />
                        {title.status}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <button type="button" onClick={onUpdate} className={`${ACTION_BUTTON} border-accent bg-accent text-bg hover:opacity-90`}>
                            <img src="/featured/check.svg" alt="" aria-hidden="true" width={15} height={15} />
                            Log progress
                        </button>
                        <button type="button" onClick={onEdit} className={`${ACTION_BUTTON} border-line bg-bg/70 text-ink hover:border-accent hover:text-accent`}>
                            Edit entry
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}
