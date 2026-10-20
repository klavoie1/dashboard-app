import {useEffect, useRef, useState} from "react";
import {Link, NavLink} from "react-router-dom";

// Rendered as a mask filled with currentColor so the icon follows the text color
function Icon({ src, box, className = '' }: { src: string; box: string; className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={`block shrink-0 bg-current ${box} ${className}`}
            style={{
                maskImage: `url(${src})`,
                WebkitMaskImage: `url(${src})`,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
            }}
        />
    )
}


const PRIMARY_LINKS = [
    { label: 'Home', to: '/'},
    { label: 'Discover', to: '/discover' },
    { label: 'My Library', to: '/library' },
    { label: 'Journal', to: '/journal' }
];

const MEDIA_CATEGORIES = [
    { id: 'all', label: 'All Media', icon: '/navbar-icons/category-all.svg' },
    { id: 'anime', label: 'Anime', icon: '/navbar-icons/category-anime.svg' },
    { id: 'audiobooks', label: 'Audiobooks', icon: '/navbar-icons/headphones.svg' },
    { id: 'books', label: 'Books', icon: '/navbar-icons/category-books.svg' },
    { id: 'games', label: 'Games', icon: '/navbar-icons/category-games.svg' },
    { id: 'light-novels', label: 'Light Novels', icon: '/navbar-icons/category-light-novel.svg' },
    { id: 'manga', label: 'Manga', icon: '/navbar-icons/category-manga.svg' },
    { id: 'movies', label: 'Movies', icon: '/navbar-icons/category-movies.svg' },
    { id: 'tv', label: 'TV Shows', icon: '/navbar-icons/category-tv.svg' }
]



export default function SiteNavbar({
    activeCategory: initialCategory = 'all',
    onCategoryChange,
    onSearch,
    userInitials = 'US',}: {
    activeCategory?: string
    onCategoryChange?: (id: string) => void
    onSearch?: (query: string) => void
    userInitials?: string
}) {

    const [activeCategory, setActiveCategory] = useState(initialCategory)
    const searchRef = useRef<HTMLInputElement>(null)
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

    // Ctrl+K focus search for the Navbar search box (⌘K for macOS)
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() == 'k') {
                e.preventDefault()
                searchRef.current?.focus()
            }
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [])

    function selectCategory(id: string, { focus = false } = {}) {
        setActiveCategory(id)
        onCategoryChange?.(id)
        if (focus) {
            const tab = tabRefs.current[id]
            tab?.focus()
            tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        }
    }

    // Arrow keys move between category tabs
    function handleTabKey(e: React.KeyboardEvent, index: number) {
        const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
        if (!step) return
        e.preventDefault()
        const next = MEDIA_CATEGORIES[(index + step + MEDIA_CATEGORIES.length) % MEDIA_CATEGORIES.length]
        selectCategory(next.id, { focus: true })
    }



    return (
        <div>
            <header id="site-navigation" className="" >

                {/* Top Section of Navbar - Global Navigation */}
                <nav id="global-nav" className="flex h-20 items-center gap-6 border-b border-line xl:gap-9">

                    {/* Keeper Logo & Name */}
                    <Link to="/" aria-label="Keeper home" className="flex shrink-0 items-center gap-2.25">
                        <span className="font-serif text-[32px] leading-normal whitespace-nowrap text-ink">Keeper</span>
                    </Link>

                    {/* Website Section Movement Area */}
                    <ul className="m-0 hidden shrink-0 list-none items-center gap-6.5 p-0 text-[13px] whitespace-nowrap md:flex">
                        {PRIMARY_LINKS.map(({ label, to }) => (
                            <li key={label}>
                                <NavLink
                                    to={to}
                                    end={to === '/'}
                                    className="transition-colors hover:text-ink aria-[current=page]:font-semibold aria-[current=page]:text-accent"
                                >
                                    {label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>


                    {/* Search Box Area */}
                    <form
                        role="search"
                        onSubmit={(e) => {
                            e.preventDefault()
                            onSearch?.(searchRef.current?.value ?? '')
                        }}
                        className="flex h-9.5 min-w-40 flex-1 items-center gap-2.5 group rounded-md border bg-surface px-3.5 transition-colors focus-within:border-accent xl:w-92 xl:flex-none"
                    >
                        <Icon src="/navbar-icons/search-icon.svg" box="size-4" className="text-ink-muted transition-colors group-focus-within:text-accent" />
                        <input
                            ref={searchRef}
                            type={"search"}
                            placeholder="Find Your Next Story"
                            aria-label="Search"
                            className="min-w-px flex-1 border-0 bg-transparent p-0 text-xs leading-normal text-ink outline-none"
                        />
                        <kbd aria-hidden="true" className="hidden font-sans text-[11px] whitespace-nowrap text-ink-muted md:inline">
                            Ctrl+K
                        </kbd>
                    </form>

                    <div className="flex flex-none items-center justify-end gap-5 xl:min-w-px xl:flex-1">
                        <button
                            type="button"
                            aria-label="Notifications"
                            className="flex cursor-pointer rounded border-0 bg-transparent p-0"
                        >
                            <Icon src="/notifications.svg" box="size-[19px]" className="text-ink-muted transition-colors hover:text-ink" />
                        </button>
                        <button
                            type="button"
                            aria-label="Account menu"
                            className="flex size-8.5 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-accent-soft p-0 text-[11px] font-semibold text-accent"
                        >
                            {userInitials}
                        </button>
                    </div>
                </nav>

                {/* Bottom Section of Navbar - Media Navigation */}
                <nav
                    aria-label="Media categories"
                    className="flex h-13 items-center gap-7 overflow-x-auto scrollbar-none"
                >
                    <p id="media-label" className="m-0 shrink-0 text-[10px] whitespace-nowrap text-ink-muted">
                        YOUR UNIVERSE
                    </p>

                    <div role="tablist" aria-labelledby="media-label" className="contents">
                        {MEDIA_CATEGORIES.map((cat, index) => {
                            const selected = activeCategory === cat.id
                            return (
                                <button
                                    key={cat.id}
                                    ref={(el) => { tabRefs.current[cat.id] = el }}
                                    type="button"
                                    role="tab"
                                    aria-selected={selected}
                                    tabIndex={selected ? 0 : -1}
                                    onClick={() => selectCategory(cat.id)}
                                    onKeyDown={(e) => handleTabKey(e, index)}
                                    className="flex h-full shrink-0 cursor-pointer items-center gap-1.75 border-0 border-b-2 border-transparent bg-transparent p-0 text-xs leading-normal whitespace-nowrap text-ink-soft transition-colors hover:text-ink aria-selected:border-accent aria-selected:text-accent"
                                >
                                    <Icon src={cat.icon} box="size-[15px]" />
                                    {cat.label}
                                </button>
                            )
                        })}
                    </div>
                </nav>

            </header>

        </div>
    )
}