// layouts/AppLayout.tsx
import { Outlet, useLocation } from "react-router-dom";
import { getCurrentUser } from "../services/auth";
import UserNavbar from "../components/UserNavbar";
import AdminNavbar from "../components/AdminNavbar";

export default function AppLayout() {
    const user = getCurrentUser();
    const isAdmin =
        user?.is_admin === true ||
        (typeof user?.role === "string" && user.role.toLowerCase() === "admin");

    const { pathname } = useLocation();
    const isAdminOnHome = isAdmin && pathname === "/home";

    return (
        <div className="min-h-screen">
            {isAdminOnHome ? <AdminNavbar /> : <UserNavbar />}
            <main className="pt-16">
                <Outlet />
            </main>
        </div>
    );
}
