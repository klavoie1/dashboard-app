import { Outlet } from "react-router-dom";
import SiteNavbar from "./SiteNavbar.tsx";

export default function Layout() {
    return (
        <div className="mx-auto w-full px-4 md:w-4/5 md:px-0">
            <SiteNavbar />
            <Outlet />
        </div>
    );
}
