import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";
import Tooltip from "../Tooltip.tsx";
import {appearanceIn, kindsOf, partLabel, portraitOf, type Character} from "./characterApi.ts";

// One character in the gallery, from the Figma character card
export default function CharacterCard({ character: c, mediaId, onFavorite }: {
    character: Character
    mediaId?: number
    onFavorite: (c: Character) => void
}) {
    const part = appearanceIn(c, mediaId)
    const others = c.appearances.length - 1
    return (
        <div className="group relative flex h-full flex-col overflow-hidden rounded-md bg-surface">
            <div className="relative aspect-3/4">
                <img src={portraitOf(c)} alt="" loading="lazy" className="size-full object-cover object-top" />
                <Tooltip label={c.favorite ? "Remove from favorites" : "Add to favorites"} side="bottom" align="end" className="absolute top-2.5 right-2.5 z-10">
                    <button
                        type="button"
                        aria-pressed={c.favorite}
                        aria-label={`${c.favorite ? "Remove" : "Add"} ${c.name} ${c.favorite ? "from" : "to"} favorites`}
                        onClick={() => onFavorite(c)}
                        className={`flex size-7.5 cursor-pointer items-center justify-center rounded border bg-bg/90 transition-colors ${c.favorite ? "border-accent/60 text-accent" : "border-line text-ink-soft hover:text-accent"}`}
                    >
                        <Icon src="/episode-icons/heart.svg" box="size-3.75" />
                    </button>
                </Tooltip>
                {c.favorite && <span className="absolute bottom-2.5 left-2.5 rounded bg-bg/90 px-2 py-1.25 text-[12px] text-accent">FAVORITE</span>}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
                {c.appearances.length > 0 && <p className="m-0 text-[12px] text-accent uppercase">{kindsOf(c)}</p>}
                <div className="flex items-center justify-between gap-2">
                    {/* ::after makes the whole card open the character; the heart sits above it */}
                    <Link to={`/characters/${c.id}`} className="truncate text-lg font-semibold text-ink after:absolute after:inset-0 group-hover:text-accent">
                        {c.name}
                    </Link>
                    <Icon src="/featured/arrow-up-right.svg" box="size-3.25" className="shrink-0 text-ink-muted" />
                </div>
                {part && (
                    <p className="m-0 truncate text-[14px] text-ink-soft">
                        {part.mediaTitle}{others > 0 ? ` · +${others} more` : ""}
                    </p>
                )}
                <p className="m-0 text-[13px] text-ink-muted">
                    {[c.role, partLabel(part?.role ?? null)].filter(Boolean).join(" · ") || " "}
                </p>
            </div>
        </div>
    )
}
