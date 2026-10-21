import {Link} from "react-router-dom";
import Icon from "../Icon.tsx";

type Shelf = {
    id: string
    label: string
    count: number
    icon: string
}

// Placeholder counts until the library totals come from the backend
const SHELVES: Shelf[] = [
    { id: 'movies', label: 'Films', count: 42, icon: '/navbar-icons/category-movies.svg' },
    { id: 'tv', label: 'TV shows', count: 28, icon: '/navbar-icons/category-tv.svg' },
    { id: 'anime', label: 'Anime', count: 36, icon: '/navbar-icons/category-anime.svg' },
    { id: 'books', label: 'Books', count: 51, icon: '/navbar-icons/category-books.svg' },
    { id: 'manga', label: 'Manga', count: 32, icon: '/navbar-icons/category-manga.svg' },
    { id: 'games', label: 'Games', count: 27, icon: '/navbar-icons/category-games.svg' },
    { id: 'audiobooks', label: 'Audiobooks', count: 18, icon: '/navbar-icons/headphones.svg' },
    { id: 'light-novels', label: 'Light novels', count: 14, icon: '/navbar-icons/category-light-novel.svg' },
]

const TOTAL = SHELVES.reduce((sum, shelf) => sum + shelf.count, 0)

const COLLECTION = { name: 'Quiet worlds, big feelings', count: 12 }

export default function LibraryOverview() {
    return (
        <section className="flex h-full flex-col gap-5.5 rounded-xl border border-line p-6">
            <div className="flex items-center justify-between gap-4">
                <h2 className="m-0 font-serif text-[27px] font-normal text-ink">
                    Your library, all together
                </h2>
                <p className="m-0 shrink-0 text-[14px] text-ink-muted">
                    {TOTAL} titles
                </p>
            </div>

            {/* Two columns of shelves, each a link into that part of the library */}
            <ul className="m-0 grid list-none grid-cols-1 gap-x-6 p-0 sm:grid-cols-2">
                {SHELVES.map((shelf) => (
                    <li key={shelf.id}>
                        <Link
                            to={`/library?category=${shelf.id}`}
                            className="group flex h-12 items-center gap-2.5 border-b border-line text-ink-soft"
                        >
                            <Icon src={shelf.icon} box="size-[15px]" className="text-ink-muted transition-colors group-hover:text-accent" />
                            <span className="flex-1 text-[15px] transition-colors group-hover:text-ink">
                                {shelf.label}
                            </span>
                            <span className="text-[15px] text-ink">
                                {shelf.count}
                            </span>
                            <Icon src="/space-icons/chevron-right.svg" box="size-3" className="text-ink-muted transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </li>
                ))}
            </ul>

            <div className="flex items-center gap-2.25">
                <Icon src="/space-icons/folder.svg" box="size-3.5" className="text-ink-muted" />
                <p className="m-0 flex-1 text-[14px] text-ink-soft">
                    {COLLECTION.name}
                </p>
                <p className="m-0 text-[13px] text-ink-muted">
                    {COLLECTION.count} titles
                </p>
            </div>

            <Link to="/library" className="mt-auto flex items-center gap-1.75 self-start text-[14px] text-accent transition-opacity hover:opacity-80">
                Open my library
                <Icon src="/featured/arrow-up-right.svg" box="size-[13px]" />
            </Link>
        </section>
    )
}
