// components/AdminNavbar.tsx (persistent across /admin/*)
import { NavLink } from "react-router-dom";

export default function AdminNavbar() {
    const link = "px-3 py-2 rounded hover:bg-black/5";
    const active = ({ isActive }: { isActive: boolean }) =>
        isActive ? `${link} underline` : link;

    return (
        <nav className="px-6 py-3 flex items-center gap-4 text-sm">
            <NavLink to="/home" className={active}>Home</NavLink>
            <NavLink to="/admin/users" className={active}>Users Management</NavLink>
            <NavLink to="/admin/quiz-results" className={active}>Quiz Results Management</NavLink>
            <NavLink to="/admin/questions" className={active}>Questions Management</NavLink>
            <NavLink to="/admin/contacts" className={active}>Contact Management</NavLink>
            <NavLink to="/logout" className={active}>Logout</NavLink>
        </nav>
    );
}
