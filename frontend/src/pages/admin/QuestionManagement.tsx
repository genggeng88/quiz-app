import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listQuestions, setQuestionStatus } from "../../services/admin";
import type { QuestionRow } from "../../types/admin";

export default function QuestionManagement() {
    const nav = useNavigate();
    const [rows, setRows] = useState<QuestionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setRows(await listQuestions({ limit: 200 }));
            } catch (e: any) {
                setErr(e?.message || "Failed to load questions");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggle = async (q: QuestionRow) => {
        try {
            const res = await setQuestionStatus(q.question_id, !q.is_active);
            setRows(rs => rs.map(r => r.question_id === q.question_id ? { ...r, is_active: res.is_active } : r));
        } catch (e: any) {
            alert(e?.message || "Failed to update status");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold">Question Bank</h1>
                <button onClick={() => nav("/admin/questions/new")} className="rounded-md bg-black text-white px-4 py-2">Add</button>
            </div>
            {err && <div className="mb-3 text-sm text-red-600">{err}</div>}
            <div className="overflow-x-auto bg-white rounded-2xl shadow">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b">
                            <th className="py-2 px-4">ID</th>
                            <th className="py-2 px-4">Category</th>
                            <th className="py-2 px-4">Question</th>
                            <th className="py-2 px-4">Status</th>
                            <th className="py-2 px-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="py-6 px-4 text-gray-500">Loading…</td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan={5} className="py-6 px-4 text-gray-500">No questions.</td></tr>
                        ) : rows.map(q => (
                            <tr key={q.question_id} className="border-b last:border-none">
                                <td className="py-2 px-4">{q.question_id}</td>
                                <td className="py-2 px-4">{q.category}</td>
                                <td className="py-2 px-4">{q.question}</td>
                                <td className="py-2 px-4">{q.is_active ? "active" : "suspended"}</td>
                                <td className="py-2 px-4 flex gap-2">
                                    <button className="rounded-md border px-3 py-1" onClick={() => nav(`/admin/questions/${q.question_id}/edit`)}>Edit</button>
                                    <button className="rounded-md border px-3 py-1" onClick={() => toggle(q)}>
                                        {q.is_active ? "Suspend" : "Activate"}
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
