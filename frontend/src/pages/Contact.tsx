// src/pages/ContactPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/auth";

type ContactItem = {
    contact_id: number;
    subject: string;
    message: string;
    email: string;
    time: string; // ISO
};

function ContactUserForm() {
    const me = getCurrentUser();
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState(me?.email ?? "");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);
        setOk(null);
        if (!subject.trim() || !message.trim() || !email.trim()) {
            setErr("Please fill all fields."); return;
        }
        try {
            setLoading(true);
            const res = await fetch("http://localhost:4000/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ subject, message, email }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || "Submit failed");
            setOk("Thanks! Your message was sent.");
            setSubject(""); setMessage("");
        } catch (e: any) {
            setErr(e?.message ?? "Submit failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Contact Us</h1>

            {err && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{err}</div>}
            {ok && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{ok}</div>}

            <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-5 grid gap-3">
                <label className="text-sm font-medium">Subject</label>
                <input className="border rounded-md p-2" value={subject} onChange={e => setSubject(e.target.value)} />

                <label className="text-sm font-medium">Your email</label>
                <input className="border rounded-md p-2" value={email} onChange={e => setEmail(e.target.value)} />

                <label className="text-sm font-medium">Message</label>
                <textarea className="border rounded-md p-2 min-h-[120px]" value={message} onChange={e => setMessage(e.target.value)} />

                <button type="submit" disabled={loading} className="rounded-md bg-black text-white py-2 mt-2 disabled:opacity-60">
                    {loading ? "Sending..." : "Send"}
                </button>
            </form>
        </div>
    );
}

export default function ContactPage() {
    const me = getCurrentUser();
    const isAdmin = me?.is_admin === true || me?.role?.toLowerCase?.() === "admin";
    const navigate = useNavigate();

    useEffect(() => {
        if (isAdmin) {
            navigate("/admin/contacts", { replace: true }); // <- send admins to admin area
        }
    }, [isAdmin, navigate]);

    // user-only form
    return <ContactUserForm />;
}

/* ------------------ Admin: list + manage ------------------ */
function ContactAdminList() {
    const [items, setItems] = useState<ContactItem[] | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("http://localhost:4000/contact", {
                    credentials: "include",
                });
                const data = await res.json();
                if (!res.ok || !data.ok) throw new Error(data?.error || "Fetch failed");
                setItems(data.data);
            } catch (e: any) {
                setErr(e?.message ?? "Failed to load contacts");
            }
        })();
    }, []);

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold">Contact Management</h1>
                <Link to="/home" className="text-sm underline">Back to Home</Link>
            </div>

            {err && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{err}</div>}

            <div className="overflow-x-auto bg-white rounded-2xl shadow">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b">
                            <th className="py-2 px-4">Time</th>
                            <th className="py-2 px-4">Subject</th>
                            <th className="py-2 px-4">Email</th>
                            <th className="py-2 px-4">Preview</th>
                            <th className="py-2 px-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!items ? (
                            <tr><td colSpan={5} className="py-6 px-4 text-gray-500">Loading…</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={5} className="py-6 px-4 text-gray-500">No messages.</td></tr>
                        ) : (
                            items.map((m) => (
                                <tr key={m.contact_id} className="border-b last:border-none">
                                    <td className="py-2 px-4 whitespace-nowrap">{new Date(m.time).toLocaleString()}</td>
                                    <td className="py-2 px-4">{m.subject}</td>
                                    <td className="py-2 px-4">{m.email}</td>
                                    <td className="py-2 px-4 truncate max-w-[28ch]">{m.message}</td>
                                    <td className="py-2 px-4">
                                        <button
                                            className="rounded-md border px-3 py-1"
                                            onClick={() => navigate(`/contact/${m.contact_id}`)}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
