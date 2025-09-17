import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listContacts } from "../../services/admin";
import type { ContactRow } from "../../types/admin";

export default function ContactManagement() {
    const nav = useNavigate();
    const [rows, setRows] = useState<ContactRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try { setLoading(true); setRows(await listContacts()); }
            catch (e: any) { setErr(e?.message || "Failed to load contacts"); }
            finally { setLoading(false); }
        })();
    }, []);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Contact Messages</h1>
            {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

            <div className="overflow-x-auto bg-white rounded-2xl shadow">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b">
                            <th className="py-2 px-4">Subject</th>
                            <th className="py-2 px-4">Email</th>
                            <th className="py-2 px-4">Time</th>
                            <th className="py-2 px-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="py-6 px-4 text-gray-500">Loading…</td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan={4} className="py-6 px-4 text-gray-500">No messages.</td></tr>
                        ) : rows.map(r => (
                            <tr key={r.contact_id} className="border-b last:border-none">
                                <td className="py-2 px-4">{r.subject}</td>
                                <td className="py-2 px-4">{r.email}</td>
                                <td className="py-2 px-4">{new Date(r.time).toLocaleString()}</td>
                                <td className="py-2 px-4">
                                    <button onClick={() => nav(`/admin/contacts/${r.contact_id}`)} className="rounded-md border px-3 py-1">
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
