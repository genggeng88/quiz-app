// src/pages/ContactDetail.tsx
import { useEffect, useState } from "react";
import { Navigate, Link, useParams } from "react-router-dom";
import { getCurrentUser } from "../services/auth";
import { getContact } from "../lib/contact";
import type { Contact } from "../lib/contact";

export default function ContactDetail() {
    const me = getCurrentUser();
    const isAdmin = me?.role === "admin";
    const { id = "" } = useParams();
    const [msg, setMsg] = useState<Contact | null>(null);

    useEffect(() => {
        setMsg(getContact(id));
    }, [id]);

    if (!isAdmin) return <Navigate to="/contact" replace />;

    if (!msg) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-2">Message Not Found</h1>
                <Link to="/contact" className="underline">Back</Link>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Contact Message</h1>
            <div className="bg-white rounded-2xl shadow p-5 space-y-2">
                <div><span className="font-medium">Subject:</span> {msg.subject}</div>
                <div><span className="font-medium">Email:</span> {msg.email}</div>
                <div><span className="font-medium">Time:</span> {new Date(msg.createdAtISO).toLocaleString()}</div>
                <div className="pt-2">
                    <div className="font-medium mb-1">Message:</div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
            </div>
            <div className="mt-4">
                <Link to="/contact" className="border rounded px-4 py-2">Back</Link>
            </div>
        </div>
    );
}
