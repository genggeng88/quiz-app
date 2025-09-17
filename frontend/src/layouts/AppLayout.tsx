// layouts/AppLayout.tsx
import { Outlet, useLocation } from "react-router-dom";
import { getCurrentUser } from "../services/auth";
import UserNavbar from "../components/UserNavbar";

export default function AppLayout() {
    const user = getCurrentUser();
    const isAdmin =
        user?.is_admin === true ||
        (typeof user?.role === "string" && user.role.toLowerCase() === "admin");

    const { pathname } = useLocation();
    const hideUserNav = isAdmin && pathname === "/home";  // <- key rule

    return (
        <div className="min-h-screen">
            {!hideUserNav && <UserNavbar />}
            <main className="pt-6">
                <Outlet />
            </main>
        </div>
    );
}
