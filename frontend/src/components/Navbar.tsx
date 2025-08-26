// src/components/Navbar.tsx
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth";
import { clearOpenQuiz, getOpenQuiz } from "../lib/quiz";

export default function Navbar() {
    const user = getCurrentUser();
    const navigate = useNavigate();
    const location = useLocation();
    const openQuiz = getOpenQuiz(); // read once per render; URL changes will re-render via Router

    const isLoggedIn = !!user;
    const isAdmin = user?.role === "admin";

    const doLogout = () => {
        logout();
        clearOpenQuiz();
        navigate("/");
    };

    const linkCls = ({ isActive }: { isActive: boolean }) =>
        `px-3 py-2 rounded-md text-sm ${isActive ? "bg-black text-white" : "hover:bg-gray-100"}`;

    return (
        <nav className="w-full border-b bg-white">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-semibold mr-2">Quiz App</span>

                    {/* Home: only when logged in */}
                    {isLoggedIn && (
                        <NavLink to="/home" className={linkCls}>
                            Home
                        </NavLink>
                    )}

                    {/* Taking Quiz: only when an open quiz exists */}
                    {openQuiz && (
                        <NavLink to={openQuiz.url} className={linkCls}>
                            Taking Quiz
                        </NavLink>
                    )}

                    {/* Contact: always visible (shared endpoint) */}
                    <NavLink to="/contact" className={linkCls}>
                        Contact Us
                    </NavLink>

                    {/* Admin quick links (optional, show when admin) */}
                    {isAdmin && (
                        <div className="relative group">
                            <button className="px-3 py-2 rounded-md text-sm hover:bg-gray-100">
                                Admin ▾
                            </button>
                            <div className="absolute hidden group-hover:block bg-white border rounded-md mt-1 shadow">
                                <NavLink to="/admin/users" className="block px-3 py-2 hover:bg-gray-100">
                                    Users
                                </NavLink>
                                <NavLink to="/admin/quiz-results" className="block px-3 py-2 hover:bg-gray-100">
                                    Quiz Results
                                </NavLink>
                                <NavLink to="/admin/questions" className="block px-3 py-2 hover:bg-gray-100">
                                    Questions
                                </NavLink>
                                <NavLink to="/contact" className="block px-3 py-2 hover:bg-gray-100">
                                    Contact Management
                                </NavLink>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Register: hide when logged in */}
                    {!isLoggedIn && (
                        <NavLink to="/register" className={linkCls}>
                            Register
                        </NavLink>
                    )}

                    {/* Login / Logout toggle */}
                    {!isLoggedIn ? (
                        <NavLink to="/" className={linkCls}>
                            Login
                        </NavLink>
                    ) : (
                        <button onClick={doLogout} className="px-3 py-2 rounded-md text-sm hover:bg-gray-100">
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
