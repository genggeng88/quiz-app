import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listQuizzes } from "../../services/admin";
import type { QuizRow } from "../../types/admin";

const fmt = (iso: string) => new Date(iso).toLocaleString();

export default function QuizResultManagement() {
    const nav = useNavigate();
    const [rows, setRows] = useState<QuizRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // filters
    const [categoryId, setCategoryId] = useState<number | "All">("All");
    const [userId, setUserId] = useState<number | "All">("All");

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setRows(await listQuizzes({ limit: 200 }));
            } catch (e: any) {
                setErr(e?.message || "Failed to load quizzes");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const userOpts = useMemo(
        () => Array.from(new Map(rows.map(r => [r.user_id, r.user_full_name])).entries()),
        [rows]
    );
    const catOpts = useMemo(
        () => Array.from(new Map(rows.map(r => [r.category_id, r.category])).entries()),
        [rows]
    );

    const filtered = rows.filter(r =>
        (categoryId === "All" || r.category_id === categoryId) &&
        (userId === "All" || r.user_id === userId)
    );

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Quiz Results</h1>
            {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="flex items-center gap-2">
                    <label className="text-sm">Category:</label>
                    <select className="border rounded-md px-3 py-2"
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value === "All" ? "All" : Number(e.target.value))}>
                        <option value="All">All</option>
                        {catOpts.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm">User:</label>
                    <select className="border rounded-md px-3 py-2"
                        value={userId}
                        onChange={e => setUserId(e.target.value === "All" ? "All" : Number(e.target.value))}>
                        <option value="All">All</option>
                        {userOpts.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-2xl shadow">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b">
                            <th className="py-2 px-4">Taken Time</th>
                            <th className="py-2 px-4">Category</th>
                            <th className="py-2 px-4">User</th>
                            <th className="py-2 px-4">No. of question</th>
                            <th className="py-2 px-4">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="py-6 px-4 text-gray-500">Loading…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={5} className="py-6 px-4 text-gray-500">No results.</td></tr>
                        ) : filtered.map(r => (
                            <tr key={r.quiz_id}
                                className="border-b last:border-none hover:bg-gray-50 cursor-pointer"
                                onClick={() => nav(`/quiz-result/${r.quiz_id}`)}>
                                <td className="py-2 px-4 whitespace-nowrap">{fmt(r.time_start)}</td>
                                <td className="py-2 px-4">{r.category}</td>
                                <td className="py-2 px-4">{r.user_full_name}</td>
                                <td className="py-2 px-4">{r.question_count}</td>
                                <td className="py-2 px-4">{Math.round(r.correct_rate * 100)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
