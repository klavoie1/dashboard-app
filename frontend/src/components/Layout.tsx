import { Outlet } from "react-router-dom";
import SiteNavbar from "./SiteNavbar.tsx";

export default function Layout() {
    return (
        <>
            <SiteNavbar />
            <Outlet />
        </>
    );
}
