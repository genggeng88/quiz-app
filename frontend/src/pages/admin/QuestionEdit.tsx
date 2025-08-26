// src/pages/admin/QuestionEdit.tsx
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CATEGORIES } from "../../lib/quiz";
import type { Category } from "../../lib/quiz";
import {
    addQuestion,
    getQuestion,
    updateQuestion,
} from "../../lib/question";
import type { ManagedQuestion } from "../../lib/question";

export default function QuestionEdit() {
    const { id } = useParams();
    const isNew = !id || id === "new";
    const navigate = useNavigate();

    const [category, setCategory] = useState<Category>("Math");
    const [description, setDescription] = useState("");
    const [options, setOptions] = useState<string[]>(["", "", "", ""]);
    const [answer, setAnswer] = useState("");
    const [status, setStatus] = useState<ManagedQuestion["status"]>("active");
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!isNew && id) {
            const q = getQuestion(id);
            if (q) {
                setCategory(q.category);
                setDescription(q.description);
                setOptions(q.options);
                setAnswer(q.answer);
                setStatus(q.status);
            }
        }
    }, [id, isNew]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        setErr(null);

        // simple validation
        if (!description.trim()) return setErr("Description is required.");
        if (options.some(o => !o.trim())) return setErr("All options are required.");
        if (!options.includes(answer)) return setErr("Answer must be one of the options.");

        if (isNew) {
            addQuestion({ category, description, options, answer, status });
        } else if (id) {
            updateQuestion(id, { category, description, options, answer, status });
        }
        navigate("/admin/questions");
    };

    const setOption = (i: number, v: string) => {
        const next = options.slice();
        next[i] = v;
        setOptions(next);
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">{isNew ? "Add Question" : "Edit Question"}</h1>
            {err && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700 border border-red-200">{err}</div>}

            <form onSubmit={submit} className="bg-white rounded-2xl shadow p-5 space-y-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Category</label>
                    <select className="border rounded-md px-3 py-2" value={category} onChange={e => setCategory(e.target.value as Category)}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm">Question Description</label>
                    <textarea className="border rounded-md px-3 py-2" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {options.map((opt, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            <label className="text-sm">Option {i + 1}</label>
                            <input className="border rounded-md px-3 py-2" value={opt} onChange={e => setOption(i, e.target.value)} />
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm">Correct Answer (must match one option)</label>
                    <input className="border rounded-md px-3 py-2" value={answer} onChange={e => setAnswer(e.target.value)} />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm">Status</label>
                    <select className="border rounded-md px-3 py-2" value={status} onChange={e => setStatus(e.target.value as any)}>
                        <option value="active">active</option>
                        <option value="suspended">suspended</option>
                    </select>
                </div>

                <div className="pt-2 flex gap-3">
                    <button type="submit" className="rounded-md bg-black text-white px-4 py-2">{isNew ? "Add" : "Save"}</button>
                    <button type="button" className="rounded-md border px-4 py-2" onClick={() => navigate("/admin/questions")}>Cancel</button>
                </div>
            </form>
        </div>
    );
}
