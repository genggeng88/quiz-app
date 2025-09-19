// components/AdminNavbar.tsx (persistent across /admin/*)
import { NavLink } from "react-router-dom";

export default function AdminNavbar() {
    const link = "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2";
    const active = ({ isActive }: { isActive: boolean }) =>
        isActive 
            ? `${link} bg-blue-100 text-blue-700 shadow-sm` 
            : `${link} text-gray-600 hover:text-gray-900 hover:bg-gray-50`;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">A</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">Admin Panel</span>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            ADMIN
                        </span>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-1">
                        <NavLink to="/home" className={active}>
                            <span className="mr-2 text-lg">🏠</span>
                            <span>Dashboard</span>
                        </NavLink>
                        
                        <NavLink to="/admin/users" className={active}>
                            <span className="mr-2 text-lg">👥</span>
                            <span>Users</span>
                        </NavLink>
                        
                        <NavLink to="/admin/quiz-results" className={active}>
                            <span className="mr-2 text-lg">📊</span>
                            <span>Results</span>
                        </NavLink>
                        
                        <NavLink to="/admin/questions" className={active}>
                            <span className="mr-2 text-lg">📝</span>
                            <span>Questions</span>
                        </NavLink>
                        
                        <NavLink to="/admin/contacts" className={active}>
                            <span className="mr-2 text-lg">📧</span>
                            <span>Contacts</span>
                        </NavLink>
                        
                        <div className="mx-2 h-6 w-px bg-gray-300"></div>
                        
                        <NavLink to="/logout" className="btn-ghost px-4 py-2 text-sm font-medium hover:bg-red-50 hover:text-red-700 transition-colors">
                            <span className="mr-2 text-lg">🚪</span>
                            <span>Logout</span>
                        </NavLink>
                    </div>
                </div>
            </div>
        </nav>
    );
}
