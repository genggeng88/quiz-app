import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listQuestions, setQuestionStatus } from "../../services/admin";
import type { QuestionRow } from "../../types/admin";

/* ---------- Reusable UI bits (inline for convenience) ---------- */

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
            <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${active ? "bg-green-400" : "bg-red-400"}`} />
            {active ? "active" : "suspended"}
        </span>
    );
}

function StatusButton({
    active,
    pending,
    onClick,
}: {
    active: boolean;
    pending: boolean;
    onClick: () => Promise<void> | void;
}) {
    const base =
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 " +
        (pending ? "opacity-60 cursor-wait" : "");
    const theme = active
        ? "bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-300"
        : "bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-300";

    return (
        <button type="button" onClick={onClick} disabled={pending} aria-busy={pending} className={`${base} ${theme}`}>
            {pending ? (
                <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0A12 12 0 002 12h2z" />
                    </svg>
                    Updating…
                </span>
            ) : active ? (
                "Suspend"
            ) : (
                "Activate"
            )}
        </button>
    );
}

function EditButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700
                  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300
                  disabled:opacity-50`}
        >
            <span className="inline-flex items-center gap-1.5">
                {/* Pencil icon */}
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-9.9 9.9a2 2 0 01-.878.506l-3.18.795a.5.5 0 01-.607-.607l.795-3.18a2 2 0 01.506-.878l9.9-9.9z" />
                </svg>
                Edit
            </span>
        </button>
    );
}

/* -------------------- Page component -------------------- */

export default function QuestionManagement() {
    const nav = useNavigate();
    const [rows, setRows] = useState<QuestionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // track which row is being toggled to show spinner/disable
    const [pendingId, setPendingId] = useState<number | null>(null);

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
        const next = !q.is_active;

        // optimistic update
        setPendingId(q.question_id);
        setRows(rs => rs.map(r => (r.question_id === q.question_id ? { ...r, is_active: next } : r)));

        try {
            const res = await setQuestionStatus(q.question_id, next);
            // ensure state matches server response
            setRows(rs => rs.map(r => (r.question_id === q.question_id ? { ...r, is_active: res.is_active } : r)));
        } catch (e: any) {
            // rollback on error
            setRows(rs => rs.map(r => (r.question_id === q.question_id ? { ...r, is_active: q.is_active } : r)));
            alert(e?.message || "Failed to update status");
        } finally {
            setPendingId(null);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Question Bank</h1>
                <button
                    onClick={() => nav("/admin/questions/new")}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800"
                >
                    Add
                </button>
            </div>

            {err && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</div>}

            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-soft">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr className="text-left">
                            <th className="px-4 py-3 font-semibold text-gray-600">ID</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Category</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Question</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Action</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    <span className="inline-flex items-center gap-2">
                                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0A12 12 0 002 12h2z" />
                                        </svg>
                                        Loading…
                                    </span>
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    No questions.
                                </td>
                            </tr>
                        ) : (
                            rows.map(q => {
                                const isPending = pendingId === q.question_id;
                                return (
                                    <tr key={q.question_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">{q.question_id}</td>
                                        <td className="px-4 py-3">{q.category}</td>
                                        <td className="px-4 py-3">{q.question}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge active={q.is_active} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <EditButton onClick={() => nav(`/admin/questions/${q.question_id}/edit`)} disabled={isPending} />
                                                <StatusButton active={q.is_active} pending={isPending} onClick={() => toggle(q)} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
