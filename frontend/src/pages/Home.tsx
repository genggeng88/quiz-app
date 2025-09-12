// src/pages/Home.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES, fetchQuizSummaries } from "../lib/quiz";
import type { Category, AttemptDetail } from "../lib/quiz";
import { getCurrentUser } from "../services/auth";

function formatSeconds(sec: number) {
    const total = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}m ${s}s`;
}

export default function Home() {
    const navigate = useNavigate();
    const [category, setCategory] = useState<Category>("Math");
    const [recent, setRecent] = useState<AttemptDetail[]>([]);
    const user = getCurrentUser();
    const isAdmin = user?.role === "admin";

    useEffect(() => {
        fetchQuizSummaries()
            .then(setRecent)
            .catch(() => setRecent([]));
    }, []);

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold">Home</h1>
                <p className="text-sm text-gray-600">
                    Signed in as <span className="font-medium">{user?.email ?? "Guest"}</span>
                    {isAdmin && <span className="ml-2 rounded bg-black/80 text-white px-2 py-[2px] text-xs">ADMIN</span>}
                </p>
            </header>

            {/* ----- Admin Panel (only for admins) ----- */}
            {isAdmin && (
                <section className="bg-white rounded-2xl shadow p-5">
                    <h2 className="text-lg font-semibold mb-4">Admin Panel</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <AdminCard to="/admin/users" label="User Management" desc="Create, deactivate, or edit users." />
                        <AdminCard to="/admin/quiz-results" label="Quiz Results" desc="Browse and manage quiz records." />
                        <AdminCard to="/admin/questions" label="Question Bank" desc="Create, edit, categorize questions." />
                        <AdminCard to="/admin/contact" label="Contact Requests" desc="Review and resolve contact forms." />
                    </div>
                </section>
            )}

            {/* ----- Start a Quiz ----- */}
            <section className="bg-white rounded-2xl shadow p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="flex items-center gap-3">
                    <label htmlFor="category" className="text-sm">Category:</label>
                    <select
                        id="category"
                        className="border rounded-md px-3 py-2"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as Category)}
                    >
                        {CATEGORIES.map((c) => (
                            <option value={c} key={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => navigate(`/quiz/${encodeURIComponent(category)}`)}
                    className="sm:ml-auto rounded-md bg-black text-white px-4 py-2"
                >
                    Start Quiz
                </button>
            </section>

            {/* ----- Recent Quiz Summary ----- */}
            <section className="bg-white rounded-2xl shadow p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Recent Quiz Summary</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b">
                                <th className="py-2 pr-4">quiz_id</th>
                                <th className="py-2 pr-4">time_taken</th>
                                <th className="py-2 pr-4">category</th>
                                <th className="py-2 pr-4">correct_rate</th>
                                <th className="py-2 pr-4">action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recent.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-4 text-gray-500">
                                        No quiz attempts yet. Start one above.
                                    </td>
                                </tr>
                            ) : (
                                recent.map((q) => (
                                    <tr key={q.quizId} className="border-b last:border-none">
                                        <td className="py-2 pr-4 font-mono truncate max-w-[20ch]">{q.quizId}</td>
                                        <td className="py-2 pr-4">{formatSeconds(q.timeTakenSec)}</td>
                                        <td className="py-2 pr-4">{q.category}</td>
                                        <td className="py-2 pr-4">{(q.correctRate * 100).toFixed(0)}%</td>
                                        <td className="py-2 pr-4">
                                            <button
                                                className="rounded-md px-3 py-1 border"
                                                onClick={() => navigate(`/quiz-result/${q.quizId}`)}
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function AdminCard({ to, label, desc }: { to: string; label: string; desc: string }) {
    return (
        <Link
            to={to}
            className="border rounded-xl p-4 hover:shadow transition flex flex-col justify-between"
        >
            <div>
                <h3 className="font-medium">{label}</h3>
                <p className="text-sm text-gray-600 mt-1">{desc}</p>
            </div>
            <span className="text-sm mt-3 underline">Open</span>
        </Link>
    );
}
