// src/pages/admin/QuizResultManagement.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES, fetchQuizSummaries } from "../../lib/quiz";
import type { AttemptDetail, Category } from "../../lib/quiz";

const PAGE_SIZE = 5;

type SortKey = "createdAtISO" | "userFullName" | "category";
type SortDir = "asc" | "desc";

export default function QuizResultManagement() {
    const navigate = useNavigate();

    const [all, setAll] = useState<AttemptDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [category, setCategory] = useState<"All" | Category>("All");
    const [userName, setUserName] = useState<"All" | string>("All");

    const [sortKey, setSortKey] = useState<SortKey>("createdAtISO");
    const [sortDir, setSortDir] = useState<SortDir>("desc"); // newest first
    const [page, setPage] = useState(1);

    // Load summaries from backend
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);
        (async () => {
            try {
                const rows = await fetchQuizSummaries();
                if (mounted) setAll(rows);
            } catch (e: any) {
                if (mounted) setError(e?.message ?? "Failed to load quiz summaries");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // Distinct user options (prefer full name, fallback to email)
    const userOptions = useMemo(() => {
        const set = new Set<string>();
        all.forEach((a) => {
            const label = a.userFullName?.trim() || a.userEmail?.trim();
            if (label) set.add(label);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [all]);

    // Apply filters
    const filtered = useMemo(() => {
        return all.filter((r) => {
            if (category !== "All" && r.category !== category) return false;
            if (userName !== "All") {
                const label = r.userFullName?.trim() || r.userEmail?.trim();
                if (label !== userName) return false;
            }
            return true;
        });
    }, [all, category, userName]);

    // Sort
    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            if (sortKey === "createdAtISO") {
                const da = new Date(a.createdAtISO || 0).getTime();
                const db = new Date(b.createdAtISO || 0).getTime();
                return sortDir === "asc" ? da - db : db - da;
            }
            if (sortKey === "userFullName") {
                const ua = (a.userFullName || a.userEmail || "").toLowerCase();
                const ub = (b.userFullName || b.userEmail || "").toLowerCase();
                const cmp = ua.localeCompare(ub);
                return sortDir === "asc" ? cmp : -cmp;
            }
            // category
            const cmp = a.category.localeCompare(b.category);
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [filtered, sortKey, sortDir]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const pageRows = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return sorted.slice(start, start + PAGE_SIZE);
    }, [sorted, page]);

    // Reset to first page on filter/sort change
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

                <div className="sm:ml-auto text-sm text-gray-600">
                    {loading ? "Loading…" : error ? <span className="text-red-600">Error: {error}</span> : `${filtered.length} result(s)`}
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
                            <th className="py-2 px-4">No. of questions</th>
                            <th className="py-2 px-4">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="py-6 px-4 text-gray-500">Loading…</td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={5} className="py-6 px-4 text-red-600">Error: {error}</td>
                            </tr>
                        ) : pageRows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-6 px-4 text-gray-500">No results.</td>
                            </tr>
                        ) : (
                            pageRows.map((r) => {
                                const questionCount = (r as any).questionCount ?? 5; // fallback if summaries don’t include it
                                return (
                                    <tr
                                        key={r.quizId}
                                        className="border-b last:border-none hover:bg-gray-50 cursor-pointer"
                                        onClick={() => navigate(`/quiz-result/${r.quizId}`)}
                                    >
                                        <td className="py-2 px-4 whitespace-nowrap">
                                            {r.createdAtISO ? new Date(r.createdAtISO).toLocaleString() : "—"}
                                        </td>
                                        <td className="py-2 px-4">{r.category}</td>
                                        <td className="py-2 px-4">{r.userFullName || r.userEmail || "—"}</td>
                                        <td className="py-2 px-4">{questionCount}</td>
                                        <td className="py-2 px-4">{(r.correctRate * 100).toFixed(0)}%</td>
                                    </tr>
                                );
                            })
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
