import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createQuestion, getQuestion, putQuestion } from "../../services/admin";
// import type { QuestionDetail } from "../../types/admin";

type Row = { choiceId?: number; description: string; isCorrect: boolean };

export default function QuestionEdit() {
    const { id = "new" } = useParams();
    const nav = useNavigate();

    const isNew = id === "new";
    const [loading, setLoading] = useState(!isNew);
    const [err, setErr] = useState<string | null>(null);

    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState(1);
    const [isActive, setIsActive] = useState(true);
    const [choices, setChoices] = useState<Row[]>([
        { description: "", isCorrect: false },
        { description: "", isCorrect: false },
    ]);

    useEffect(() => {
        if (isNew) return;
        (async () => {
            try {
                setLoading(true);
                const q = await getQuestion(Number(id));
                setDescription(q.question);
                setCategoryId(q.category_id);
                setIsActive(q.is_active);
                setChoices(q.choices.map(c => ({
                    choiceId: c.choice_id,
                    description: c.description,
                    isCorrect: c.is_correct,
                })));
            } catch (e: any) {
                setErr(e?.message || "Failed to load question");
            } finally {
                setLoading(false);
            }
        })();
    }, [id, isNew]);

    const setOnlyCorrect = (idx: number) =>
        setChoices(cs => cs.map((c, i) => ({ ...c, isCorrect: i === idx })));

    const addChoice = () => setChoices(cs => [...cs, { description: "", isCorrect: false }]);

    const save = async () => {
        try {
            if (choices.length === 0) throw new Error("Please add at least one choice");
            const correctCount = choices.filter(c => c.isCorrect).length;
            if (correctCount !== 1) throw new Error("Exactly one choice must be correct");

            if (isNew) {
                // POST create: no isActive on question in the create endpoint (per your backend); adjust if added
                await createQuestion({
                    description,
                    categoryId,
                    choices: choices.map(c => ({ description: c.description, isCorrect: c.isCorrect })),
                });
            } else {
                // PUT whole update (question + choices)
                await putQuestion(Number(id), {
                    description,
                    categoryId,
                    isActive,
                    choices: choices.map(c => ({ choiceId: c.choiceId, description: c.description, isCorrect: c.isCorrect })),
                });
            }
            nav("/admin/questions");
        } catch (e: any) {
            setErr(e?.message || "Failed to save");
        }
    };

    if (loading) return <div className="p-6">Loading…</div>;

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-4">
            <h1 className="text-2xl font-semibold">{isNew ? "Add Question" : "Edit Question"}</h1>
            {err && <div className="text-sm text-red-600">{err}</div>}

            <label className="block text-sm font-medium">Question</label>
            <textarea className="w-full border rounded-md p-2" rows={3} value={description} onChange={e => setDescription(e.target.value)} />

            <div className="flex gap-4">
                <div>
                    <label className="block text-sm font-medium">Category ID</label>
                    <input type="number" className="border rounded-md p-2 w-28" value={categoryId} onChange={e => setCategoryId(Number(e.target.value))} />
                </div>
                {!isNew && (
                    <label className="flex items-center gap-2 mt-6">
                        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                        Active
                    </label>
                )}
            </div>

            <div className="space-y-2">
                <div className="font-medium">Choices</div>
                {choices.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <input
                            className="flex-1 border rounded-md p-2"
                            placeholder={`Choice ${i + 1}`}
                            value={c.description}
                            onChange={e => setChoices(cs => cs.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
                        />
                        <label className="text-sm flex items-center gap-1">
                            <input type="radio" name="correct" checked={c.isCorrect} onChange={() => setOnlyCorrect(i)} />
                            Correct
                        </label>
                    </div>
                ))}
                <button className="rounded-md border px-3 py-1" onClick={addChoice}>Add choice</button>
            </div>

            <div className="flex gap-2">
                <button onClick={() => history.back()} className="rounded-md border px-4 py-2">Cancel</button>
                <button onClick={save} className="rounded-md bg-black text-white px-4 py-2">Save</button>
            </div>
        </div>
    );
}
