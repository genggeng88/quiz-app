// src/pages/Contact.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../services/auth";
import { addContact, listContacts } from "../lib/contact";
import type { Contact } from "../lib/contact";

const PAGE_SIZE = 5;

export default function Contact() {
    const me = getCurrentUser();
    const isAdmin = me?.role === "admin";
    return isAdmin ? <AdminContactView /> : <PublicContactForm />;
}

/* -------------------- Admin view (table + pagination) -------------------- */
function AdminContactView() {
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
                            <tr>
                                <td colSpan={5} className="py-6 px-4 text-gray-500">No messages.</td>
                            </tr>
                        ) : (
                            pageRows.map((m) => (
                                <tr key={m.id} className="border-b last:border-none">
                                    <td className="py-2 px-4">{m.subject}</td>
                                    <td className="py-2 px-4">{m.email}</td>
                                    <td className="py-2 px-4 whitespace-nowrap">
                                        {new Date(m.createdAtISO).toLocaleString()}
                                    </td>
                                    <td className="py-2 px-4">{truncate(m.content, 60)}</td>
                                    <td className="py-2 px-4">
                                        <Link to={`/contact/${m.id}`} className="border rounded px-3 py-1">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center gap-2">
                <button
                    className="border rounded px-3 py-1"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                >
                    Prev
                </button>
                <span className="text-sm">Page {page} / {totalPages}</span>
                <button
                    className="border rounded px-3 py-1"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

function truncate(s: string, n: number) {
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/* -------------------- Public view (contact form) -------------------- */
function PublicContactForm() {
    const [subject, setSubject] = useState("");
    const [email, setEmail] = useState("");
    const [content, setContent] = useState("");
    const [done, setDone] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);

        if (!subject.trim()) return setErr("Subject is required.");
        if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Valid email is required.");
        if (!content.trim()) return setErr("Message content is required.");

        addContact(subject.trim(), email.trim(), content.trim());
        setDone(true);
        setSubject(""); setEmail(""); setContent("");
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Contact Us</h1>

            {done && (
                <div className="mb-3 rounded-md bg-green-50 p-2 text-sm text-green-700 border border-green-200">
                    Thanks! Your message has been sent.
                </div>
            )}
            {err && (
                <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700 border border-red-200">
                    {err}
                </div>
            )}

            <form onSubmit={submit} className="bg-white rounded-2xl shadow p-5 space-y-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Subject</label>
                    <input className="border rounded-md px-3 py-2" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm">Email address</label>
                    <input type="email" className="border rounded-md px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm">Message content</label>
                    <textarea rows={6} className="border rounded-md px-3 py-2" value={content} onChange={(e) => setContent(e.target.value)} />
                </div>

                <button type="submit" className="rounded-md bg-black text-white px-4 py-2">Send</button>
            </form>
        </div>
    );
}
