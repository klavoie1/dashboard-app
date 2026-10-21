import {Link} from "react-router-dom";

// Loading, missing and error states shared by the title and episode pages
export default function TitleStatus({ status, backTo }: { status: "loading" | "missing" | "error", backTo?: { to: string, label: string } }) {
    if (status === "loading") {
        return <main className="py-10"><p className="m-0 text-base text-ink-muted" role="status">Loading…</p></main>
    }
    return (
        <main className="py-10">
            <h1 className="m-0 font-serif text-3xl font-normal text-ink">
                {status === "missing" ? "Not found" : "Couldn’t load this"}
            </h1>
            {status === "error" && <p className="m-0 mt-2 text-base text-ink-muted">Check that the server is running, then try again.</p>}
            <Link to={backTo?.to ?? "/"} className="mt-3 inline-block text-[14px] text-accent hover:opacity-80">{backTo?.label ?? "Back home"}</Link>
        </main>
    )
}
