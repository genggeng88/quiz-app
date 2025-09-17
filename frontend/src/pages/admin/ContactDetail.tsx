import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getContact } from "../../services/admin";
import type { ContactRow } from "../../types/admin";

export default function ContactDetail() {
    const { contactId = "" } = useParams();
    const [row, setRow] = useState<ContactRow | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try { setRow(await getContact(Number(contactId))); }
            catch (e: any) { setErr(e?.message || "Failed to load contact"); }
        })();
    }, [contactId]);

    if (err) return <div className="p-6">{err}</div>;
    if (!row) return <div className="p-6">Loading…</div>;

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-3">
            <h1 className="text-2xl font-semibold">Contact Message</h1>
            <div><span className="font-medium">Subject:</span> {row.subject}</div>
            <div><span className="font-medium">Email:</span> {row.email}</div>
            <div><span className="font-medium">Time:</span> {new Date(row.time).toLocaleString()}</div>
            <div className="bg-white rounded-2xl shadow p-4">
                <pre className="whitespace-pre-wrap break-words">{row.message}</pre>
            </div>
            <Link to="/admin/contacts" className="underline">Back</Link>
        </div>
    );
}
