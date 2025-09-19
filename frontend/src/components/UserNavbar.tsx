// components/UserNavbar.tsx
import { Link, useLocation } from "react-router-dom";
import { getCurrentUser } from "../services/auth";

export default function UserNavbar() {
    const { pathname } = useLocation();
    const user = getCurrentUser();
    // const isAdmin =
    //     user?.is_admin === true ||
    //     (typeof user?.role === "string" && user.role.toLowerCase() === "admin");

    // const onAdminHome = isAdmin && pathname === "/home"; // hide extras on admin's /home

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 w-full">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 w-full">
                    {/* Logo and Navigation */}
                    <div className="flex items-center space-x-6">
                        <Link to="/home" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">Q</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">QuizApp</span>
                        </Link>
                        
                        <div className="flex items-center space-x-4">
                            <Link 
                                to="/home" 
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    pathname === '/home' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                Home
                            </Link>
                            <Link 
                                to="/contact" 
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    pathname === '/contact' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                Contact Us
                            </Link>
                        </div>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 font-semibold text-lg">👤</span>
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-gray-900 truncate max-w-32">{user?.email}</p>
                            </div>
                        </div>
                        
                        <Link 
                            to="/logout" 
                            className="btn-ghost px-3 py-2 text-sm font-medium hover:bg-red-50 hover:text-red-700 transition-colors flex items-center"
                        >
                            <span className="mr-1 text-lg">🚪</span>
                            <span className="hidden sm:inline">Logout</span>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
