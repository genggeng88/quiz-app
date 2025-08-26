// src/pages/admin/QuestionManagement.tsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES } from "../../lib/quiz";
import type { Category } from "../../lib/quiz";
import {
    listQuestions,
    toggleQuestionStatus,
} from "../../lib/question";

import type { ManagedQuestion } from "../../lib/question";

const PAGE_SIZE = 5;

export default function QuestionManagement() {
    const navigate = useNavigate();
    const [all, setAll] = useState<ManagedQuestion[]>(() => listQuestions());
    const [category, setCategory] = useState<"All" | Category>("All");
    const [page, setPage] = useState(1);

    const filtered = useMemo(
        () => all.filter(q => (category === "All" ? true : q.category === category)),
        [all, category]
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filtered.slice(start, start + PAGE_SIZE);
    }, [filtered, page]);

    const refresh = () => setAll(listQuestions());

    const toggle = (id: string) => {
        toggleQuestionStatus(id);
        refresh();
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold">Question Management</h1>
                <button
                    className="rounded-md bg-black text-white px-4 py-2"
                    onClick={() => navigate("/admin/questions/new")}
                >
                    Add Question
                </button>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-2xl shadow p-4 mb-4 flex items-center gap-3">
                <label className="text-sm">Category:</label>
                <select
                    className="border rounded-md px-3 py-2"
                    value={category}
                    onChange={(e) => { setCategory(e.target.value as any); setPage(1); }}
                >
                    <option value="All">All</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="overflow-x-auto bg-white rounded-2xl shadow">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b">
                            <th className="py-2 px-4">Category</th>
                            <th className="py-2 px-4">Question Description</th>
                            <th className="py-2 px-4">Answer</th>
                            <th className="py-2 px-4">Status</th>
                            <th className="py-2 px-4">Updated</th>
                            <th className="py-2 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.length === 0 ? (
                            <tr><td className="py-6 px-4 text-gray-500" colSpan={6}>No questions.</td></tr>
                        ) : pageRows.map(q => (
                            <tr key={q.id} className="border-b last:border-none">
                                <td className="py-2 px-4">{q.category}</td>
                                <td className="py-2 px-4">{truncate(q.description, 80)}</td>
                                <td className="py-2 px-4">{q.answer}</td>
                                <td className="py-2 px-4">
                                    <span className={`inline-block rounded px-2 py-[2px] text-xs ${q.status === "active"
                                        ? "bg-green-50 text-green-700 border border-green-200"
                                        : "bg-red-50 text-red-700 border border-red-200"
                                        }`}>{q.status}</span>
                                </td>
                                <td className="py-2 px-4 whitespace-nowrap">{new Date(q.updatedAtISO).toLocaleString()}</td>
                                <td className="py-2 px-4">
                                    <div className="flex gap-2">
                                        <Link to={`/admin/questions/${q.id}`} className="border rounded px-3 py-1">Edit</Link>
                                        <button onClick={() => toggle(q.id)} className="border rounded px-3 py-1">
                                            {q.status === "active" ? "Suspend" : "Activate"}
                                        </button>
                                    </div>
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
