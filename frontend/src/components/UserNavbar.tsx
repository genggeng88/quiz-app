// components/UserNavbar.tsx
import { Link, useLocation } from "react-router-dom";
import { getCurrentUser } from "../services/auth";

export default function UserNavbar() {
    const { pathname } = useLocation();
    const user = getCurrentUser();
    const isAdmin =
        user?.is_admin === true ||
        (typeof user?.role === "string" && user.role.toLowerCase() === "admin");

    const onAdminHome = isAdmin && pathname === "/home"; // hide extras on admin's /home

    return (
        <nav className="px-6 py-3 flex items-center gap-6 text-sm">
            <Link to="/home">Home</Link>
            <Link to="/contact">Contact Us</Link>

            {/* if you had an Admin dropdown inside user navbar, gate it strictly */}
            {!onAdminHome && false && isAdmin && (
                <div className="ml-4">Admin ▾ {/* (optional) */}</div>
            )}

            <span className="ml-auto">{user?.email}</span>
            <Link to="/logout" className="rounded px-2 py-1 border">Logout</Link>
        </nav>
    );
}
