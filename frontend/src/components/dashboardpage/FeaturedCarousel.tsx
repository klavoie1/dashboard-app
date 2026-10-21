import {useEffect, useState} from "react";
import FeaturedJourney, {type FeaturedJourneyProps} from "./FeaturedJourney.tsx";
import Icon from "../Icon.tsx";
import Tooltip from "../Tooltip.tsx";

type Slide = Omit<FeaturedJourneyProps, "controls"> & { id: number }

// Placeholder slides until in-progress titles come from the API
const SLIDES: Slide[] = [
    {
        id: 1,
        title: "Frieren",
        subtitle: "Beyond Journey’s End",
        artwork: "/featured/frieren.jpg",
        artworkPosition: "50% 25%",
        nextUp: "Up next: 07 · Like a Fairy Tale  ·  24 min",
        progress: 6,
        total: 28,
        unit: "episodes watched",
        actionLabel: "Mark episode 7 watched",
        viewLabel: "View anime",
        viewTo: "/library/1",
        status: "IN YOUR LIBRARY · WATCHING",
    },
    {
        id: 7,
        title: "Piranesi",
        subtitle: "Susanna Clarke",
        artwork: "/discover/piranesi.jpg",
        nextUp: "Up next: Part 3 · The Other  ·  about 4 hours left",
        progress: 88,
        total: 272,
        unit: "pages read",
        actionLabel: "Log pages",
        viewLabel: "View book",
        viewTo: "/library/7",
        status: "IN YOUR LIBRARY · READING",
    },
    {
        id: 103,
        title: "Spiritfarer",
        subtitle: "Thunder Lotus",
        artwork: "/discover/spiritfarer.jpg",
        nextUp: "Up next: Hummingberg  ·  last played 3 days ago",
        progress: 42,
        total: 100,
        unit: "% complete",
        actionLabel: "Log session",
        viewLabel: "View game",
        viewTo: "/library/103",
        status: "IN YOUR LIBRARY · PLAYING",
    },
]

// How long each title stays before moving on
const ROTATE_MS = 8000

const NAV_BUTTON = "flex size-8 cursor-pointer items-center justify-center rounded-full border border-line bg-bg/70 text-ink backdrop-blur transition-colors hover:border-accent hover:text-accent"

export default function FeaturedCarousel() {
    const [index, setIndex] = useState(0)
    // Hover and focus pause rotation for a moment; the button stops it until pressed again
    const [hovered, setHovered] = useState(false)
    const [focused, setFocused] = useState(false)
    // Starts stopped for people who ask their system for reduced motion
    const [stopped, setStopped] = useState(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
    const slide = SLIDES[index]
    const rotating = SLIDES.length > 1 && !stopped && !hovered && !focused

    // A fresh timer per slide, so a manual change also restarts the countdown
    useEffect(() => {
        if (!rotating) return
        const timer = setTimeout(() => {
            setIndex((i) => (i + 1) % SLIDES.length)
        }, ROTATE_MS)
        return () => clearTimeout(timer)
    }, [index, rotating])

    // Wraps around at both ends
    function go(step: number) {
        setIndex((i) => (i + step + SLIDES.length) % SLIDES.length)
    }

    const controls = SLIDES.length > 1 && (
        <div className="flex items-center gap-3">
            <Tooltip label="Previous" side="top">
                <button type="button" onClick={() => go(-1)} aria-label="Previous title" className={NAV_BUTTON}>
                    <Icon src="/space-icons/chevron-right.svg" box="size-3.5" className="rotate-180" />
                </button>
            </Tooltip>

            <div className="flex items-center gap-1.5">
                {SLIDES.map((s, i) => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => setIndex(i)}
                        aria-label={`Show ${s.title}`}
                        aria-current={i === index}
                        className="h-1.5 w-1.5 cursor-pointer rounded-full bg-ink-muted transition-all hover:bg-ink aria-[current=true]:w-5 aria-[current=true]:bg-accent"
                    />
                ))}
            </div>

            <Tooltip label={stopped ? "Play" : "Pause"} side="top">
                <button
                    type="button"
                    onClick={() => setStopped((v) => !v)}
                    aria-label={stopped ? "Start rotating titles" : "Stop rotating titles"}
                    className={NAV_BUTTON}
                >
                    {stopped ? (
                        // Play triangle
                        <span aria-hidden="true" className="ml-0.5 size-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-current" />
                    ) : (
                        // Pause bars
                        <span aria-hidden="true" className="flex gap-0.75">
                            <span className="h-2.5 w-0.75 rounded-sm bg-current" />
                            <span className="h-2.5 w-0.75 rounded-sm bg-current" />
                        </span>
                    )}
                </button>
            </Tooltip>

            <Tooltip label="Next" side="top" align="end">
                <button type="button" onClick={() => go(1)} aria-label="Next title" className={NAV_BUTTON}>
                    <Icon src="/space-icons/chevron-right.svg" box="size-3.5" />
                </button>
            </Tooltip>
        </div>
    )

    return (
        <div
            aria-roledescription="carousel"
            aria-label="Pick up where you left off"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            // Keyboard focus only; a mouse click would otherwise keep it paused after the pointer leaves
            onFocus={(e) => setFocused(e.target.matches(':focus-visible'))}
            onBlur={(e) => {
                // Only resume once focus has left the carousel entirely
                if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
            }}
        >
            {/* Announces changes; silent while rotating so screen readers aren't interrupted */}
            <p aria-live={rotating ? "off" : "polite"} className="sr-only">
                {`${index + 1} of ${SLIDES.length}: ${slide.title}`}
            </p>
            {/* key resets the hero's poster detection for each new artwork */}
            <FeaturedJourney key={slide.id} {...slide} controls={controls} />
        </div>
    )
}
