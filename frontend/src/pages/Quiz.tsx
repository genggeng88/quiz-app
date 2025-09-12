// src/pages/Quiz.tsx
import { useEffect, useMemo, useState } from "react";
import type { Category, Question } from "../lib/quiz";
import {
    generateQuiz,
    submitQuiz,
    setOpenQuiz,
    clearOpenQuiz,
} from "../lib/quiz";
import { getCurrentUser } from "../services/auth";
import { useParams, useLocation, useNavigate } from "react-router-dom";

function formatSeconds(sec: number) {
    const total = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}m ${s}s`;
}

export default function Quiz() {
    const { categoryId = "Math" } = useParams();
    const category = decodeURIComponent(categoryId) as Category;
    const navigate = useNavigate();
    const location = useLocation();

    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [answers, setAnswers] = useState<Record<string, string>>({}); // qid -> choiceId
    const [index, setIndex] = useState(0);
    const [startedAt, setStartedAt] = useState<number>(() => Date.now());
    const [nowTick, setNowTick] = useState<number>(() => Date.now()); // drives timer UI
    const [submitting, setSubmitting] = useState(false);

    // Load 5 questions for this category
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);
        setAnswers({});
        setIndex(0);
        setStartedAt(Date.now());

        (async () => {
            try {
                const qs = await generateQuiz(category);
                if (mounted) setQuestions(qs);
            } catch (e: any) {
                if (mounted) setError(e?.message ?? "Failed to load quiz");
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => { mounted = false; };
    }, [category]);

    // 1-second ticker so the timer updates
    useEffect(() => {
        const t = setInterval(() => setNowTick(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    // Mark quiz as open while on this page
    useEffect(() => {
        const startedAtISO = new Date().toISOString();
        setOpenQuiz({ url: location.pathname, category, startedAtISO });
        return () => clearOpenQuiz();
    }, [category, location.pathname]);

    const currentQ = questions[index];

    const choose = (qid: string, choiceId: string) =>
        setAnswers((prev) => ({ ...prev, [qid]: choiceId }));

    const canPrev = index > 0;
    const canNext = index < Math.max(0, questions.length - 1);

    const prev = () => canPrev && setIndex((i) => i - 1);
    const next = () => canNext && setIndex((i) => i + 1);

    const submit = async () => {
        if (!questions.length) return;
        const elapsedSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        try {
            setSubmitting(true);
            const { quizId } = await submitQuiz(category, answers);
            clearOpenQuiz();
            navigate(`/quiz-result/${quizId}`, { replace: true, state: { timeTakenSec: elapsedSec } });
        } catch (e: any) {
            setError(e?.message ?? "Failed to submit");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <header className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                    Category: <span className="font-medium">{category}</span> • Question{" "}
                    {Math.min(index + 1, Math.max(questions.length, 1))}/{Math.max(questions.length, 1)}
                </div>
                <div className="text-sm text-gray-600">
                    Time: {formatSeconds(Math.round((nowTick - startedAt) / 1000))}
                </div>
            </header>

            {loading ? (
                <div className="text-sm text-gray-600">Loading questions…</div>
            ) : error ? (
                <div className="text-sm text-red-600">Error: {error}</div>
            ) : !currentQ ? (
                <div className="text-sm text-gray-600">No questions available.</div>
            ) : (
                <>
                    <QuestionCard
                        question={currentQ}
                        selected={answers[currentQ.id] ?? ""}
                        onSelect={(choiceId) => choose(currentQ.id, choiceId)}
                    />

                    <div className="mt-6 flex items-center justify-between">
                        <button
                            onClick={prev}
                            disabled={!canPrev || submitting}
                            className="rounded-md px-4 py-2 border disabled:opacity-50"
                        >
                            Prev
                        </button>

                        {index < questions.length - 1 ? (
                            <button
                                onClick={next}
                                disabled={submitting}
                                className="rounded-md px-4 py-2 border"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={submit}
                                disabled={submitting}
                                className="rounded-md px-4 py-2 bg-black text-white disabled:opacity-50"
                            >
                                {submitting ? "Submitting…" : "Submit Quiz"}
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function QuestionCard({
    question,
    selected,
    onSelect,
}: {
    question: Question;
    selected: string; // choiceId
    onSelect: (choiceId: string) => void;
}) {
    return (
        <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-lg font-semibold mb-3">{question.prompt}</h3>
            <div className="grid gap-2">
                {question.options.map((opt) => {
                    const id = `${question.id}-${opt.id}`;
                    return (
                        <label
                            key={id}
                            className={`flex items-center gap-3 border rounded-md p-3 cursor-pointer ${selected === opt.id ? "bg-gray-50 border-gray-400" : ""
                                }`}
                        >
                            <input
                                type="radio"
                                name={question.id}
                                checked={selected === opt.id}
                                onChange={() => onSelect(opt.id)}
                                className="accent-black"
                            />
                            <span>{opt.text}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
