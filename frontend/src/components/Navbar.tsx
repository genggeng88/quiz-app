// src/components/Navbar.tsx
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth";
import { clearOpenQuiz, getOpenQuiz } from "../lib/quiz";

export default function Navbar() {
    const user = getCurrentUser();
    const navigate = useNavigate();
    const location = useLocation();
    const openQuiz = getOpenQuiz(); // re-renders on URL change
    const isLoggedIn = !!user;
    const isAdmin = user?.role === "admin";

    // ✅ Brand goes to /home if logged in, else /login
    const brandTo = isLoggedIn ? "/home" : "/login";

    const doLogout = () => {
        logout();
        clearOpenQuiz();
        navigate("/login", { replace: true }); // ✅ send to /login after logout
    };

    const linkCls = ({ isActive }: { isActive: boolean }) =>
        `px-3 py-2 rounded-md text-sm ${isActive ? "bg-black text-white" : "hover:bg-gray-100"}`;

    return (
        <nav className="w-full border-b bg-white">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* ✅ Brand link */}
                    <Link to={brandTo} className="font-semibold mr-2 hover:opacity-80" aria-label="Quiz App">
                        Quiz App
                    </Link>

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

                    {/* Contact: always visible */}
                    <NavLink to="/contact" className={linkCls}>
                        Contact Us
                    </NavLink>

                    {/* Admin quick links */}
                    {isAdmin && (
                        <div className="relative group">
                            <button className="px-3 py-2 rounded-md text-sm hover:bg-gray-100">Admin ▾</button>
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
                    {!isLoggedIn && (
                        <NavLink to="/register" className={linkCls}>
                            Register
                        </NavLink>
                    )}

                    {!isLoggedIn ? (
                        <NavLink to="/login" className={linkCls}>
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