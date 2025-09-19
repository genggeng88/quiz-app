// src/pages/Quiz.tsx
import { useEffect, useMemo, useState } from "react";
import type { Category, Question } from "../lib/quiz";
import { generateQuiz, submitQuiz, setOpenQuiz, clearOpenQuiz } from "../lib/quiz";
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
    const [startedAt, setStartedAt] = useState<number>(() => Date.now());
    const [nowTick, setNowTick] = useState<number>(() => Date.now()); // drives timer UI
    const [submitting, setSubmitting] = useState(false);

    // Load 5 questions for this category
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);
        setAnswers({});
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

    const choose = (qid: string, choiceId: string) =>
        setAnswers((prev) => ({ ...prev, [qid]: choiceId }));

    const answeredCount = useMemo(
        () => questions.reduce((acc, q) => acc + (answers[q.id] ? 1 : 0), 0),
        [answers, questions]
    );

    const submit = async () => {
        if (!questions.length) return;
        const elapsedSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        const timeStartISO = new Date(startedAt).toISOString();
        const timeEndISO = new Date().toISOString();
        try {
            setSubmitting(true);
            const { quizId } = await submitQuiz(category, answers, {
                timeStart: timeStartISO,
                timeEnd: timeEndISO,
            });
            clearOpenQuiz();
            navigate(`/quiz/result/${quizId}`, { replace: true, state: { timeTakenSec: elapsedSec } });
        } catch (e: any) {
            setError(e?.message ?? "Failed to submit");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="card p-6 mb-8 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{category} Quiz</h1>
                                <p className="text-gray-600">
                                    Question {answeredCount + 1} of {Math.max(questions.length, 1)}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                            {/* Progress Bar */}
                            <div className="hidden sm:flex items-center space-x-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-600">
                                    {Math.round((answeredCount / Math.max(questions.length, 1)) * 100)}%
                                </span>
                            </div>
                            
                            {/* Timer */}
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-lg font-semibold text-gray-900">
                                    {formatSeconds(Math.round((nowTick - startedAt) / 1000))}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                {loading ? (
                    <div className="card p-12 text-center">
                        <div className="flex items-center justify-center space-x-2 text-gray-500">
                            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-lg">Loading questions...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="card p-8 text-center">
                        <div className="text-red-500 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Quiz</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="btn-primary"
                        >
                            Try Again
                        </button>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="card p-8 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Questions Available</h3>
                        <p className="text-gray-600">There are no questions available for this category at the moment.</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            {questions.map((q, i) => (
                                <QuestionCard
                                    key={q.id}
                                    index={i}
                                    question={q}
                                    selected={answers[q.id] ?? ""}
                                    onSelect={(choiceId) => choose(q.id, choiceId)}
                                />
                            ))}
                        </div>

                        {/* Submit Section */}
                        <div className="mt-8 card p-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-center sm:text-left">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Ready to submit?</h3>
                                    <p className="text-gray-600">
                                        You've answered {answeredCount} of {questions.length} questions
                                    </p>
                                </div>
                                <button
                                    onClick={submit}
                                    disabled={submitting}
                                    className="btn-primary px-8 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Submit Quiz
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function QuestionCard({
    index,
    question,
    selected,
    onSelect,
}: {
    index: number;
    question: Question;
    selected: string; // choiceId
    onSelect: (choiceId: string) => void;
}) {
    // in case options were strings for any reason, normalize
    const opts = (question.options as any[]).map((o) =>
        typeof o === "string" ? { id: o, text: o } : o
    );

    return (
        <div className="card p-8 animate-fade-in">
            <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">{index + 1}</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {question.prompt}
                    </h3>
                    <p className="text-gray-600">Choose the best answer from the options below:</p>
                </div>
            </div>
            
            <div className="space-y-3">
                {opts.map((opt, optIndex) => {
                    const id = `${question.id}-${opt.id}`;
                    const isSelected = selected === opt.id;
                    const optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D
                    
                    return (
                        <label
                            key={id}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                isSelected 
                                    ? "bg-blue-50 border-blue-500 shadow-md" 
                                    : "bg-white border-gray-200 hover:border-gray-300"
                            }`}
                        >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                isSelected 
                                    ? "bg-blue-500 text-white" 
                                    : "bg-gray-100 text-gray-600"
                            }`}>
                                {optionLetter}
                            </div>
                            
                            <input
                                type="radio"
                                name={`q-${question.id}`}
                                checked={isSelected}
                                onChange={() => onSelect(opt.id)}
                                className="sr-only"
                            />
                            
                            <div className="flex-1">
                                <span className={`text-lg ${
                                    isSelected ? "text-gray-900 font-medium" : "text-gray-700"
                                }`}>
                                    {opt.text}
                                </span>
                            </div>
                            
                            {isSelected && (
                                <div className="flex-shrink-0">
                                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
