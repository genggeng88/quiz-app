// src/pages/admin/ContactManagement.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listContacts } from "../../lib/contact";
import type { Contact } from "../../lib/contact";

const PAGE_SIZE = 5;

export default function ContactManagement() {
    const [all, setAll] = useState<Contact[]>(() => listContacts());
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    const pageRows = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return all.slice(start, start + PAGE_SIZE);
    }, [all, page]);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Contact Us Management</h1>

            <div className="overflow-x-auto bg-white rounded-2xl shadow">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b">
                            <th className="py-2 px-4">Subject</th>
                            <th className="py-2 px-4">Email</th>
                            <th className="py-2 px-4">Time</th>
                            <th className="py-2 px-4">Message</th>
                            <th className="py-2 px-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.length === 0 ? (
                            <tr><td colSpan={5} className="py-6 px-4 text-gray-500">No messages.</td></tr>
                        ) : pageRows.map(m => (
                            <tr key={m.id} className="border-b last:border-none">
                                <td className="py-2 px-4">{m.subject}</td>
                                <td className="py-2 px-4">{m.email}</td>
                                <td className="py-2 px-4 whitespace-nowrap">{new Date(m.createdAtISO).toLocaleString()}</td>
                                <td className="py-2 px-4">{truncate(m.content, 60)}</td>
                                <td className="py-2 px-4">
                                    <Link to={`/admin/contact/${m.id}`} className="border rounded px-3 py-1">View</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center gap-2">
                <button className="border rounded px-3 py-1" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
                <span className="text-sm">Page {page} / {totalPages}</span>
                <button className="border rounded px-3 py-1" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
            </div>
        </div>
    );
}

function truncate(s: string, n: number) {
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
