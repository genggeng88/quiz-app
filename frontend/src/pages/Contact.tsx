// src/pages/ContactPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/auth";
import { api } from "../services/auth";

// type ContactItem = {
//     contact_id: number;
//     subject: string;
//     message: string;
//     email: string;
//     time: string; // ISO
// };

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

            type ContactResp = { id?: number | string } | null | void;
            await api<ContactResp>("/contact", {
                method: "POST",
                body: JSON.stringify({ subject: subject.trim(), message: message.trim(), email: email.trim() }),
                // Content-Type is auto-set in api() unless body is FormData
            })

            setOk("Thanks! Your message was sent.");
            setSubject(""); setMessage("");
        } catch (e: any) {
            setErr(e?.message ?? "Submit failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Contact Us</h1>
                    <p className="text-lg text-gray-600">We'd love to hear from you. Send us a message!</p>
                </div>

                {/* Form */}
                <div className="card p-8 animate-fade-in">
                    <form onSubmit={onSubmit} className="space-y-6">
                        {/* Error Alert */}
                        {err && (
                            <div className="alert alert-error">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {err}
                            </div>
                        )}

                        {/* Success Alert */}
                        {ok && (
                            <div className="alert alert-success">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {ok}
                            </div>
                        )}

                        {/* Subject Field */}
                        <div>
                            <label className="form-label">Subject</label>
                            <input
                                className="form-input"
                                placeholder="What's this about?"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                required
                            />
                        </div>

                        {/* Email Field */}
                        <div>
                            <label className="form-label">Your Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="your@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {/* Message Field */}
                        <div>
                            <label className="form-label">Message</label>
                            <textarea
                                className="form-input min-h-[120px] resize-none"
                                placeholder="Tell us more about your inquiry..."
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Send Message
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
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
// function ContactAdminList() {
//     const [items, setItems] = useState<ContactItem[] | null>(null);
//     const [err, setErr] = useState<string | null>(null);
//     const navigate = useNavigate();

//     useEffect(() => {
//         (async () => {
//             try {
//                 const res = await fetch("http://localhost:4000/contact", {
//                     credentials: "include",
//                 });
//                 const data = await res.json();
//                 if (!res.ok || !data.ok) throw new Error(data?.error || "Fetch failed");
//                 setItems(data.data);
//             } catch (e: any) {
//                 setErr(e?.message ?? "Failed to load contacts");
//             }
//         })();
//     }, []);

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
//             <div className="max-w-7xl mx-auto">
//                 {/* Header */}
//                 <div className="mb-8">
//                     <div className="flex items-center justify-between">
//                         <div>
//                             <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Management</h1>
//                             <p className="text-gray-600">Manage user inquiries and support messages</p>
//                         </div>
//                         <Link to="/home" className="btn-secondary">
//                             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
//                             </svg>
//                             Back to Home
//                         </Link>
//                     </div>
//                 </div>

//                 {/* Error Alert */}
//                 {err && (
//                     <div className="alert alert-error mb-6">
//                         <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                         </svg>
//                         {err}
//                     </div>
//                 )}

//                 {/* Messages Table */}
//                 <div className="card overflow-hidden">
//                     {!items ? (
//                         <div className="flex items-center justify-center py-12">
//                             <div className="flex items-center space-x-2 text-gray-500">
//                                 <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
//                                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                                 </svg>
//                                 <span className="text-lg">Loading messages...</span>
//                             </div>
//                         </div>
//                     ) : items.length === 0 ? (
//                         <div className="text-center py-12">
//                             <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                             </svg>
//                             <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
//                             <p className="text-gray-500">No contact messages have been received.</p>
//                         </div>
//                     ) : (
//                         <div className="overflow-x-auto">
//                             <table className="w-full">
//                                 <thead className="bg-gray-50">
//                                     <tr>
//                                         <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                             Time
//                                         </th>
//                                         <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                             Subject
//                                         </th>
//                                         <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                             Email
//                                         </th>
//                                         <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                             Preview
//                                         </th>
//                                         <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                             Actions
//                                         </th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="bg-white divide-y divide-gray-200">
//                                     {items.map((m) => (
//                                         <tr key={m.contact_id} className="hover:bg-gray-50 transition-colors">
//                                             <td className="px-6 py-4 whitespace-nowrap">
//                                                 <div className="text-sm text-gray-900">
//                                                     {new Date(m.time).toLocaleDateString()}
//                                                 </div>
//                                                 <div className="text-sm text-gray-500">
//                                                     {new Date(m.time).toLocaleTimeString()}
//                                                 </div>
//                                             </td>
//                                             <td className="px-6 py-4">
//                                                 <div className="text-sm font-medium text-gray-900">{m.subject}</div>
//                                             </td>
//                                             <td className="px-6 py-4">
//                                                 <div className="text-sm text-gray-900">{m.email}</div>
//                                             </td>
//                                             <td className="px-6 py-4">
//                                                 <div className="text-sm text-gray-600 max-w-xs truncate" title={m.message}>
//                                                     {m.message}
//                                                 </div>
//                                             </td>
//                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                                                 <button
//                                                     className="btn-secondary px-4 py-2 text-sm"
//                                                     onClick={() => navigate(`/admin/contacts/${m.contact_id}`)}
//                                                 >
//                                                     <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                                                     </svg>
//                                                     View
//                                                 </button>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }
