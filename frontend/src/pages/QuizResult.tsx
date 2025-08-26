// src/pages/QuizResult.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getAttempt } from "../lib/quiz";
import type { AttemptDetail } from "../lib/quiz";

export default function QuizResult() {
    const { quizId = "" } = useParams();
    const [attempt, setAttempt] = useState<AttemptDetail | null>(null);

    useEffect(() => {
        setAttempt(getAttempt(quizId));
    }, [quizId]);

    if (!attempt) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-2">Quiz Result</h1>
                <p className="text-gray-600">Could not find quiz result for <code>{quizId}</code>.</p>
                <p className="mt-4"><Link to="/home" className="underline">Back to Home</Link></p>
            </div>
        );
    }

    const correctCount = attempt.questions.reduce(
        (acc, q) => acc + (attempt.answers[q.id] === q.answer ? 1 : 0),
        0
    );

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold mb-2">Quiz Result</h1>
            <div className="text-sm text-gray-600 mb-6">
                Quiz ID: <span className="font-mono">{attempt.quizId}</span> • Category:{" "}
                <span className="font-medium">{attempt.category}</span> • Score:{" "}
                <span className="font-medium">
                    {correctCount}/{attempt.questions.length} ({(attempt.correctRate * 100).toFixed(0)}%)
                </span>
            </div>

            <div className="grid gap-4">
                {attempt.questions.map((q) => {
                    const chosen = attempt.answers[q.id];
                    const correct = q.answer;
                    const isCorrect = chosen === correct;
                    return (
                        <div key={q.id} className="bg-white rounded-2xl shadow p-5">
                            <h3 className="text-lg font-semibold mb-2">{q.prompt}</h3>
                            <ul className="grid gap-2">
                                {q.options.map((opt) => (
                                    <li
                                        key={opt}
                                        className={[
                                            "border rounded-md p-3",
                                            opt === correct ? "border-green-500" : "",
                                            chosen === opt && !isCorrect ? "border-red-500" : "",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{opt}</span>
                                            {opt === correct && <span className="text-green-600 text-xs">✓ correct</span>}
                                            {chosen === opt && !isCorrect && <span className="text-red-600 text-xs">your answer</span>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6">
                <Link to="/home" className="rounded-md border px-4 py-2">Back to Home</Link>
            </div>
        </div>
    );
}
