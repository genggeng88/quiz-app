// src/components/Navbar.tsx
import { useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth";
import { clearOpenQuiz, getOpenQuiz } from "../lib/quiz";

export default function Navbar() {
    const user = getCurrentUser();
    const navigate = useNavigate();
    const location = useLocation();
    const openQuiz = getOpenQuiz(); // reads once per render
    const isLoggedIn = !!user;
    const isAdmin = user?.role === "admin";

    const [mobileOpen, setMobileOpen] = useState(false);
    const brandTo = isLoggedIn ? "/home" : "/login";

    const doLogout = () => {
        logout();
        clearOpenQuiz();
        navigate("/login", { replace: true });
    };

    const navItemCls = ({ isActive }: { isActive: boolean }) =>
        [
            "relative px-3 py-2 rounded-md text-sm transition",
            isActive
                ? "text-black after:absolute after:left-3 after:right-3 after:-bottom-[2px] after:h-[2px] after:bg-black after:rounded-full"
                : "text-gray-700 hover:text-black hover:bg-black/5",
        ].join(" ");

    return (
        <header className="sticky top-0 z-50">
            <nav className="backdrop-blur bg-white/80 border-b">
                <div className="mx-auto max-w-7xl px-4">
                    {/* Row */}
                    <div className="h-14 flex items-center justify-between">
                        {/* Left: Brand + Desktop Links */}
                        <div className="flex items-center gap-2">
                            {/* Brand */}
                            <Link
                                to={brandTo}
                                className="font-semibold text-lg tracking-tight hover:opacity-90 select-none"
                                aria-label="Quiz App"
                            >
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-600">
                                    Quiz App
                                </span>
                            </Link>

                            {/* Desktop nav */}
                            <div className="hidden md:flex items-center gap-1 ml-2">
                                {isLoggedIn && (
                                    <NavLink to="/home" className={navItemCls}>
                                        Home
                                    </NavLink>
                                )}

                                {openQuiz && (
                                    <NavLink to={openQuiz.url} className={navItemCls}>
                                        Taking Quiz
                                    </NavLink>
                                )}

                                <NavLink to="/contact" className={navItemCls}>
                                    Contact Us
                                </NavLink>

                                {isAdmin && (
                                    <div className="relative group">
                                        <button
                                            className="px-3 py-2 rounded-md text-sm text-gray-700 hover:text-black hover:bg-black/5"
                                            aria-haspopup="menu"
                                            aria-expanded="false"
                                            aria-label="Admin menu"
                                        >
                                            Admin ▾
                                        </button>
                                        <div className="absolute left-0 mt-1 hidden group-hover:block bg-white/95 backdrop-blur border rounded-xl shadow-lg min-w-[200px] overflow-hidden">
                                            <NavLink to="/admin/users" className={menuItemCls}>
                                                Users
                                            </NavLink>
                                            <NavLink to="/admin/quiz-results" className={menuItemCls}>
                                                Quiz Results
                                            </NavLink>
                                            <NavLink to="/admin/questions" className={menuItemCls}>
                                                Questions
                                            </NavLink>
                                            <NavLink to="/contact" className={menuItemCls}>
                                                Contact Management
                                            </NavLink>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Auth Buttons (Desktop) */}
                        <div className="hidden md:flex items-center gap-2">
                            {!isLoggedIn && (
                                <NavLink to="/register" className={navItemCls}>
                                    Register
                                </NavLink>
                            )}
                            {!isLoggedIn ? (
                                <NavLink to="/login" className={navItemCls}>
                                    Login
                                </NavLink>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="hidden sm:inline text-xs text-gray-600">
                                        {user?.fullName || user?.email}
                                    </span>
                                    <button
                                        onClick={doLogout}
                                        className="px-3 py-2 rounded-md text-sm bg-black text-white hover:opacity-90"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}

/* --- small helpers for menu styles --- */
const menuItemCls = ({ isActive }: { isActive: boolean }) =>
    [
        "block px-3 py-2 text-sm transition",
        isActive ? "bg-black/5 text-black" : "text-gray-700 hover:bg-black/5 hover:text-black",
    ].join(" ");

const mobileItemCls = ({ isActive }: { isActive: boolean }) =>
    [
        "px-3 py-2 rounded-md text-sm transition",
        isActive ? "bg-black text-white" : "text-gray-700 hover:text-black hover:bg-black/5",
    ].join(" ");
