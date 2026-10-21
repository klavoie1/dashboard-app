import {Link} from "react-router-dom";
import Icon from "./Icon.tsx";
import Tooltip from "./Tooltip.tsx";

const CURRENT_YEAR = new Date().getFullYear()
const REPO_URL = "https://github.com/klavoie1/keeper-media-tracker"

export default function SiteFooter() {
    return (
        <footer className="flex flex-col items-center gap-3 border-t border-line py-7 text-center md:flex-row md:justify-between md:text-left">
            <Link to="/" className="font-serif text-[22px] text-ink-soft transition-colors hover:text-ink">
                Keeper
            </Link>

            <p className="m-0 text-[15px] text-ink-muted">
                {CURRENT_YEAR} · Self-hosted · Your data stays with you
            </p>

            <Tooltip label="View on GitHub" align="end">
                <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Keeper on GitHub"
                    className="flex text-ink-muted transition-colors hover:text-ink"
                >
                    <Icon src="/footer-icons/GitHub_Invertocat_White.svg" box="size-4" />
                </a>
            </Tooltip>
        </footer>
    )
}
