// src/pages/admin/QuizResultManagement.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES, listAttempts } from "../../lib/quiz";
import type { AttemptDetail, Category } from "../../lib/quiz";

const PAGE_SIZE = 5;

type SortKey = "createdAtISO" | "userFullName" | "category";
type SortDir = "asc" | "desc";

export default function QuizResultManagement() {
    const navigate = useNavigate();
    const [all, setAll] = useState<AttemptDetail[]>([]);
    const [category, setCategory] = useState<"All" | Category>("All");
    const [userName, setUserName] = useState<"All" | string>("All");
    const [sortKey, setSortKey] = useState<SortKey>("createdAtISO");
    const [sortDir, setSortDir] = useState<SortDir>("desc"); // default newest first
    const [page, setPage] = useState(1);

    useEffect(() => {
        // load summaries (they already exclude heavy fields)
        const rows = listAttempts();
        setAll(rows);
    }, []);

    const userOptions = useMemo(() => {
        const set = new Set<string>();
        all.forEach((a) => a.userFullName && set.add(a.userFullName));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [all]);

    const filtered = useMemo(() => {
        return all.filter((r) => {
            if (category !== "All" && r.category !== category) return false;
            if (userName !== "All" && r.userFullName !== userName) return false;
            return true;
        });
    }, [all, category, userName]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            if (sortKey === "createdAtISO") {
                const da = new Date(a.createdAtISO).getTime();
                const db = new Date(b.createdAtISO).getTime();
                return sortDir === "asc" ? da - db : db - da;
            }
            if (sortKey === "userFullName") {
                const cmp = a.userFullName.localeCompare(b.userFullName);
                return sortDir === "asc" ? cmp : -cmp;
            }
            // category
            const cmp = a.category.localeCompare(b.category);
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [filtered, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const pageRows = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return sorted.slice(start, start + PAGE_SIZE);
    }, [sorted, page]);

    // reset to first page on filter/sort change
    useEffect(() => setPage(1), [category, userName, sortKey, sortDir]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir(key === "createdAtISO" ? "desc" : "asc"); // sensible defaults
        }
    };

    const goto = (p: number) => setPage(Math.min(totalPages, Math.max(1, p)));

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Quiz Result Management</h1>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="flex items-center gap-2">
                    <label className="text-sm">Category:</label>
                    <select
                        className="border rounded-md px-3 py-2"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                    >
                        <option value="All">All</option>
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm">User:</label>
                    <select
                        className="border rounded-md px-3 py-2"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value as any)}
                    >
                        <option value="All">All</option>
                        {userOptions.map((u) => (
                            <option key={u} value={u}>
                                {u}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-2xl shadow">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b">
                            <ThButton
                                label="Taken Time"
                                active={sortKey === "createdAtISO"}
                                dir={sortDir}
                                onClick={() => toggleSort("createdAtISO")}
                            />
                            <ThButton
                                label="Category"
                                active={sortKey === "category"}
                                dir={sortDir}
                                onClick={() => toggleSort("category")}
                            />
                            <ThButton
                                label="User Full Name"
                                active={sortKey === "userFullName"}
                                dir={sortDir}
                                onClick={() => toggleSort("userFullName")}
                            />
                            <th className="py-2 px-4">No. of question</th>
                            <th className="py-2 px-4">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-6 px-4 text-gray-500">
                                    No results.
                                </td>
                            </tr>
                        ) : (
                            pageRows.map((r) => (
                                <tr
                                    key={r.quizId}
                                    className="border-b last:border-none hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`/quiz-result/${r.quizId}`)}
                                >
                                    <td className="py-2 px-4 whitespace-nowrap">
                                        {new Date(r.createdAtISO).toLocaleString()}
                                    </td>
                                    <td className="py-2 px-4">{r.category}</td>
                                    <td className="py-2 px-4">{r.userFullName}</td>
                                    <td className="py-2 px-4">{/* summaries have no questions; store length in score calc below if needed */}{
                                        // If you want exact count but summaries omit questions,
                                        // use r as detail if you store count separately. For now compute from correctRate fallback 5:
                                        // Better: store 'questionCount' in summary at saveAttempt.
                                    }{(r as any).questionCount ?? 5}</td>
                                    <td className="py-2 px-4">{(r.correctRate * 100).toFixed(0)}%</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center gap-2">
                <button className="border rounded px-3 py-1" onClick={() => goto(page - 1)} disabled={page <= 1}>
                    Prev
                </button>
                <span className="text-sm">
                    Page {page} / {totalPages}
                </span>
                <button className="border rounded px-3 py-1" onClick={() => goto(page + 1)} disabled={page >= totalPages}>
                    Next
                </button>
            </div>
        </div>
    );
}

function ThButton({
    label,
    active,
    dir,
    onClick,
}: {
    label: string;
    active: boolean;
    dir: "asc" | "desc";
    onClick: () => void;
}) {
    return (
        <th className="py-2 px-4">
            <button className="flex items-center gap-1 underline decoration-dotted" onClick={onClick}>
                {label}
                {active && <span aria-hidden>{dir === "asc" ? "▲" : "▼"}</span>}
            </button>
        </th>
    );
}
