// src/pages/admin/UserManagement.tsx
import { useMemo, useState } from "react";
import { listAllUsers, setUserStatus } from "../../services/auth";
import type { Status, User } from "../../services/auth";

const PAGE_SIZE = 5;

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>(() => listAllUsers());
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
    const pageUsers = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return users.slice(start, start + PAGE_SIZE);
    }, [users, page]);

    const toggleStatus = (email: string, current: Status) => {
        const next: Status = current === "active" ? "suspended" : "active";
        setUserStatus(email, next);
        setUsers(listAllUsers());
    };

    const goto = (p: number) => setPage(Math.min(totalPages, Math.max(1, p)));

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">User Management</h1>

            <div className="overflow-x-auto bg-white rounded-2xl shadow">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b">
                            <th className="py-2 px-4">Full Name</th>
                            <th className="py-2 px-4">Email</th>
                            <th className="py-2 px-4">Role</th>
                            <th className="py-2 px-4">Status</th>
                            <th className="py-2 px-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-6 px-4 text-gray-500">
                                    No users.
                                </td>
                            </tr>
                        ) : (
                            pageUsers.map((u) => (
                                <tr key={u.email} className="border-b last:border-none">
                                    <td className="py-2 px-4">{u.fullName}</td>
                                    <td className="py-2 px-4">{u.email}</td>
                                    <td className="py-2 px-4">{u.role}</td>
                                    <td className="py-2 px-4">
                                        <span
                                            className={`inline-block rounded px-2 py-[2px] text-xs ${u.status === "active" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                                                }`}
                                        >
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="py-2 px-4">
                                        <button
                                            className="rounded-md border px-3 py-1"
                                            onClick={() => toggleStatus(u.email, u.status)}
                                        >
                                            {u.status === "active" ? "Suspend" : "Activate"}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center gap-2">
                <button className="border rounded px-3 py-1" onClick={() => goto(page - 1)} disabled={page <= 1}>
                    Prev
                </button>
                <span className="text-sm">
                    Page {page} / {totalPages}
                </span>
                <button className="border rounded px-3 py-1" onClick={() => goto(page + 1)} disabled={page >= totalPages}>
                    Next
                </button>
            </div>
        </div>
    );
}
