import { useEffect, useMemo, useState } from "react";
import { listUsers, setUserStatus } from "../../services/admin";
import type { UserRow } from "../../types/admin";

const PAGE = 10;

export default function UserManagement() {
    const [rows, setRows] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setRows(await listUsers());
            } catch (e: any) {
                setErr(e?.message || "Failed to load users");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE));
    const pageRows = useMemo(() => rows.slice((page - 1) * PAGE, page * PAGE), [rows, page]);

    const toggle = async (u: UserRow) => {
        const next = u.status === "active" ? "suspended" : "active";
        try {
            const updated = await setUserStatus(u.user_id, next);
            setRows(r => r.map(x => (x.user_id === updated.user_id ? updated : x)));
        } catch (e: any) {
            alert(e?.message || "Failed to update status");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">User Management</h1>
            {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

            <div className="overflow-x-auto bg-white rounded-2xl shadow">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b">
                            <th className="py-2 px-4">Full Name</th>
                            <th className="py-2 px-4">Email</th>
                            <th className="py-2 px-4">Status</th>
                            <th className="py-2 px-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="py-6 px-4 text-gray-500">Loading…</td></tr>
                        ) : pageRows.length === 0 ? (
                            <tr><td colSpan={4} className="py-6 px-4 text-gray-500">No users.</td></tr>
                        ) : pageRows.map(u => (
                            <tr key={u.user_id} className="border-b last:border-none">
                                <td className="py-2 px-4">{u.full_name}</td>
                                <td className="py-2 px-4">{u.email}</td>
                                <td className="py-2 px-4">
                                    <span className={`inline-block rounded px-2 py-[2px] text-xs ${u.status === "active" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                        {u.status}
                                    </span>
                                </td>
                                <td className="py-2 px-4">
                                    <button className="rounded-md border px-3 py-1" onClick={() => toggle(u)}>
                                        {u.status === "active" ? "Suspend" : "Activate"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center gap-2">
                <button className="border rounded px-3 py-1" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
                <span className="text-sm">Page {page} / {totalPages}</span>
                <button className="border rounded px-3 py-1" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
            </div>
        </div>
    );
}
