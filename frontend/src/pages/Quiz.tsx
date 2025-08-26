// src/pages/Quiz.tsx
import { useEffect, useMemo, useState } from "react";
import type { Category, Question } from "../lib/quiz";
import { generateQuestions, computeScore, saveAttempt, newQuizId, setOpenQuiz, clearOpenQuiz } from "../lib/quiz";
import { getCurrentUser } from "../services/auth";
import { useParams, useLocation, useNavigate } from "react-router-dom";

function formatSeconds(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
}

export default function Quiz() {
    const { categoryId = "Math" } = useParams();
    const category = decodeURIComponent(categoryId) as Category;
    const navigate = useNavigate();

    const questions = useMemo(() => generateQuestions(category), [category]);

    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [index, setIndex] = useState(0);
    const [startedAt, setStartedAt] = useState<number>(() => Date.now());

    useEffect(() => {
        setAnswers({});
        setIndex(0);
        setStartedAt(Date.now());
    }, [category]);

    const currentQ = questions[index];

    const choose = (qid: string, option: string) =>
        setAnswers((prev) => ({ ...prev, [qid]: option }));

    const canPrev = index > 0;
    const canNext = index < questions.length - 1;

    const prev = () => canPrev && setIndex((i) => i - 1);
    const next = () => canNext && setIndex((i) => i + 1);

    const submit = () => {
        const elapsedSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        const correctRate = computeScore(questions, answers);
        const quizId = newQuizId();
        const me = getCurrentUser();

        saveAttempt({
            quizId,
            category,
            createdAtISO: new Date().toISOString(),
            timeTakenSec: elapsedSec,
            correctRate,
            questions,
            answers,
            userEmail: me?.email ?? "anonymous@example.com",
            userFullName: me?.fullName ?? "Anonymous",
        });

        navigate(`/quiz-result/${quizId}`);
    };

    const location = useLocation();

    useEffect(() => {
        // mark quiz as "open" when on the quiz page
        setOpenQuiz({
            url: location.pathname,
            category,
            startedAtISO: new Date().toISOString(),
        });
        // clear when leaving this page
        return () => clearOpenQuiz();
    }, [category, location.pathname]);

    // in submit() right before navigate(...)
    clearOpenQuiz();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <header className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                    Category: <span className="font-medium">{category}</span> • Question{" "}
                    {index + 1}/{questions.length}
                </div>
                <div className="text-sm text-gray-600">
                    Time: {formatSeconds(Math.round((Date.now() - startedAt) / 1000))}
                </div>
            </header>

            {currentQ && (
                <QuestionCard
                    question={currentQ}
                    selected={answers[currentQ.id] ?? ""}
                    onSelect={(opt) => choose(currentQ.id, opt)}
                />
            )}

            <div className="mt-6 flex items-center justify-between">
                <button onClick={prev} disabled={!canPrev} className="rounded-md px-4 py-2 border disabled:opacity-50">
                    Prev
                </button>

                {index < questions.length - 1 ? (
                    <button onClick={next} className="rounded-md px-4 py-2 border">
                        Next
                    </button>
                ) : (
                    <button onClick={submit} className="rounded-md px-4 py-2 bg-black text-white">
                        Submit Quiz
                    </button>
                )}
            </div>
        </div>
    );
}

function QuestionCard({
    question,
    selected,
    onSelect,
}: {
    question: Question;
    selected: string;
    onSelect: (opt: string) => void;
}) {
    return (
        <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-lg font-semibold mb-3">{question.prompt}</h3>
            <div className="grid gap-2">
                {question.options.map((opt) => {
                    const id = `${question.id}-${opt}`;
                    return (
                        <label
                            key={id}
                            className={`flex items-center gap-3 border rounded-md p-3 cursor-pointer ${selected === opt ? "bg-gray-50 border-gray-400" : ""
                                }`}
                        >
                            <input
                                type="radio"
                                name={question.id}
                                checked={selected === opt}
                                onChange={() => onSelect(opt)}
                                className="accent-black"
                            />
                            <span>{opt}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

