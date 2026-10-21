import { Outlet } from "react-router-dom";
import SiteNavbar from "./SiteNavbar.tsx";
import SiteFooter from "./SiteFooter.tsx";
import {CONTAINER} from "./container.ts";

export default function Layout() {
    return (
        // Column layout so the footer sits at the bottom of short pages
        <div className="flex min-h-screen flex-col">
            <SiteNavbar />
            <div className={`${CONTAINER} flex-1`}>
                <Outlet />
            </div>
            <div className={CONTAINER}>
                <SiteFooter />
            </div>
        </div>
    );
}
