// layouts/AdminLayout.tsx
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";

export default function AdminLayout() {
    return (
        <div className="min-h-screen">
            <AdminNavbar />
            <main className="pt-16">
                <Outlet />
            </main>
        </div>
    );
}
