import {useEffect, useState} from "react";
import FeaturedJourney, {type FeaturedJourneyProps} from "./FeaturedJourney.tsx";
import Icon from "../Icon.tsx";
import Tooltip from "../Tooltip.tsx";
import {Link, useNavigate} from "react-router-dom";
import {coverOf, quickStep, statusLabel, typeOf, unitOf, updatedText, type MediaSummary} from "../library/media.ts";

type Slide = Omit<FeaturedJourneyProps, "controls"> & { id: number }

// How many recent titles the hero rotates through
const MAX_SLIDES = 3

// What a slide is: something in progress, next on your list, or one you've finished
type SlideKind = "active" | "next" | "past"

const EYEBROWS: Record<SlideKind, string> = {
    active: "PICK UP WHERE YOU LEFT OFF",
    next: "NEXT ON YOUR LIST",
    past: "ONE TO REMEMBER",
}

const byRecent = (a: MediaSummary, b: MediaSummary) => (b.lastActivityOn ?? "").localeCompare(a.lastActivityOn ?? "") || b.id - a.id

// Fills the hero from your library: in-progress titles first, then your "for later" list,
// then titles you've finished or paused, so it shows something whenever the library has anything
function toSlides(media: MediaSummary[], onLog: (m: MediaSummary) => void, open: (m: MediaSummary) => void): Slide[] {
    const picks: [MediaSummary, SlideKind][] = [
        ...media.filter((m) => m.status === "in-progress").sort(byRecent).map((m) => [m, "active"] as [MediaSummary, SlideKind]),
        ...media.filter((m) => m.status === "want").sort((a, b) => b.id - a.id).map((m) => [m, "next"] as [MediaSummary, SlideKind]),
        ...media.filter((m) => m.status === "finished" || m.status === "paused").sort(byRecent).map((m) => [m, "past"] as [MediaSummary, SlideKind]),
    ]
    return picks.slice(0, MAX_SLIDES).map(([m, kind]) => {
        const step = kind === "past" ? null : quickStep(m)
        const percent = unitOf(m) === "percent" || m.kind === "game"
        const type = typeOf(m)
        return {
            id: m.id,
            eyebrow: EYEBROWS[kind],
            title: m.title,
            subtitle: m.subtitle ?? m.creator ?? undefined,
            artwork: m.backdrop ?? coverOf(m),
            artworkPosition: m.backdropPosition ?? undefined,
            nextUp: kind === "next" ? "Saved for later · ready when you are"
                : kind === "past" ? (m.finishedOn ? `Finished ${updatedText(m.finishedOn).replace("Updated ", "")}` : "On hold")
                : m.lastActivityOn ? updatedText(m.lastActivityOn).replace("Updated", "Last updated") : "Just started",
            progress: m.progress,
            total: percent ? 100 : m.total ?? 0,
            unit: percent ? "% complete" : unitOf(m) === "minutes" ? "minutes" : unitOf(m),
            // Starting something on your list logs its first step, which moves it to in progress
            actionLabel: step ? (kind === "next" ? `Start · ${step.label}` : step.label) : `Revisit this ${type.toLowerCase()}`,
            onAction: step ? () => onLog(m) : () => open(m),
            viewLabel: `View ${type.toLowerCase()}`,
            viewTo: `/library/${m.id}`,
            status: `IN YOUR LIBRARY · ${statusLabel(m).toUpperCase()}`,
        }
    })
}

// How long each title stays before moving on
const ROTATE_MS = 8000

const NAV_BUTTON = "flex size-8 cursor-pointer items-center justify-center rounded-full border border-line bg-bg/70 text-ink backdrop-blur transition-colors hover:border-accent hover:text-accent"

export default function FeaturedCarousel({ media, onLog }: { media: MediaSummary[] | null, onLog: (m: MediaSummary) => void }) {
    const navigate = useNavigate()
    const SLIDES = toSlides(media ?? [], onLog, (m) => navigate(`/library/${m.id}`))
    const [chosen, setIndex] = useState(0)
    // Stays in range when a title drops out (e.g. you finish it)
    const index = SLIDES.length ? chosen % SLIDES.length : 0
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
        const count = SLIDES.length
        const timer = setTimeout(() => {
            setIndex((i) => (i + 1) % count)
        }, ROTATE_MS)
        return () => clearTimeout(timer)
    }, [index, rotating, SLIDES.length])

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

    if (media !== null && SLIDES.length === 0) {
        return (
            <section className="flex min-h-72 flex-col items-start justify-center gap-4 rounded-xl border border-line px-6 py-10 md:px-12">
                <p className="m-0 flex items-center gap-2.5 text-[13px] font-semibold text-accent">
                    <span aria-hidden="true" className="block h-0.5 w-7 bg-accent" />
                    YOUR LIBRARY IS EMPTY
                </p>
                <h2 className="m-0 font-serif text-5xl font-normal text-ink">Start a new story</h2>
                <p className="m-0 max-w-xl text-base text-ink-soft">Add something to watch, read, play or listen to, and it will wait for you here.</p>
                <Link to="/search" className="mt-2 rounded-md border border-accent bg-accent px-3.5 py-2.75 text-[15px] font-semibold text-bg hover:opacity-90">Find something</Link>
            </section>
        )
    }
    if (!slide) return <section aria-busy="true" className="min-h-96" />

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
