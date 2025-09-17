// src/pages/QuizResult.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchQuizResult } from "../lib/quiz";
import type { AttemptDetail } from "../lib/quiz";

export default function QuizResult() {
    const { quizId = "" } = useParams();
    const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        const idNum = Number(quizId);
        if (!quizId || Number.isNaN(idNum)) {
            setError("Invalid quiz id");
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const data = await fetchQuizResult(idNum);
                if (mounted) setAttempt(data);
            } catch (e: any) {
                if (mounted) setError(e?.message ?? "Failed to load result");
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [quizId]);

    if (loading) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-2">Quiz Result</h1>
                <p className="text-gray-600">Loading…</p>
            </div>
        );
    }

    if (error || !attempt) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-2">Quiz Result</h1>
                <p className="text-gray-600">
                    {error ? `Error: ${error}` : `Could not find quiz result for `}
                    {!error && <code>{quizId}</code>}
                </p>
                <p className="mt-4">
                    <Link to="/home" className="underline">Back to Home</Link>
                </p>
            </div>
        );
    }

    const correctCount = attempt.questions.reduce((acc, q) => {
        const chosenId = attempt.answers[q.id] ?? "";
        return acc + (chosenId === q.answer ? 1 : 0);
    }, 0);

    const total = Math.max(1, attempt.questions.length);
    const rate = attempt.correctRate > 0 ? attempt.correctRate : correctCount / total;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold mb-2">Quiz Result</h1>

            <div className="text-sm text-gray-600 mb-6">
                Quiz ID: <span className="font-mono">{attempt.quizId}</span> • Category:{" "}
                <span className="font-medium">{attempt.category}</span> • Score:{" "}
                <span className="font-medium">
                    {correctCount}/{total} ({(rate * 100).toFixed(0)}%)
                </span>
            </div>

            <div className="grid gap-4">
                {attempt.questions.map((q, i) => {
                    const chosenId = attempt.answers[q.id] ?? "";
                    const correctId = q.answer; // correct choiceId
                    const isCorrect = chosenId === correctId;

                    return (
                        <div key={q.id} className="bg-white rounded-2xl shadow p-5">
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="text-lg font-semibold mb-2">
                                    Q{i + 1}. {q.prompt}
                                </h3>
                                <span
                                    className={`text-xs px-2 py-1 rounded ${isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {isCorrect ? "Correct" : "Incorrect"}
                                </span>
                            </div>

                            {q.options.length > 0 ? (
                                <ul className="grid gap-2">
                                    {q.options.map((opt) => (
                                        <li
                                            key={opt.id}
                                            className={[
                                                "border rounded-md p-3",
                                                opt.id === correctId ? "border-green-500" : "",
                                                chosenId === opt.id && !isCorrect ? "border-red-500" : "",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{opt.text}</span>
                                                {opt.id === correctId && (
                                                    <span className="text-green-600 text-xs">✓ correct</span>
                                                )}
                                                {chosenId === opt.id && !isCorrect && (
                                                    <span className="text-red-600 text-xs">your answer</span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                // Fallback if backend didn't return options
                                <div className="text-sm text-gray-700">
                                    <div>
                                        Correct answer ID:{" "}
                                        <span className="font-mono">{correctId || "(unknown)"}</span>
                                    </div>
                                    <div>
                                        Your answer ID:{" "}
                                        <span className="font-mono">{chosenId || "(none)"}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}