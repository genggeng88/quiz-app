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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="card p-12 text-center">
                        <div className="flex items-center justify-center space-x-2 text-gray-500">
                            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-lg">Loading quiz result...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !attempt) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="card p-8 text-center">
                        <div className="text-red-500 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Result Not Found</h1>
                        <p className="text-gray-600 mb-6">
                            {error ? `Error: ${error}` : `Could not find quiz result for ID: ${quizId}`}
                        </p>
                        <Link to="/home" className="btn-primary">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Back to Home
                        </Link>
                    </div>
                </div>
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
                    <p className="text-lg text-gray-600">Here's how you performed</p>
                </div>

                {/* Score Summary */}
                <div className="card p-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                                {correctCount}/{total}
                            </div>
                            <div className="text-sm text-gray-600">Questions Correct</div>
                        </div>
                        <div className="text-center">
                            <div className={`text-3xl font-bold mb-2 ${
                                rate >= 0.8 ? 'text-green-600' : rate >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                                {(rate * 100).toFixed(0)}%
                            </div>
                            <div className="text-sm text-gray-600">Overall Score</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-600 mb-2">
                                {attempt.category}
                            </div>
                            <div className="text-sm text-gray-600">Category</div>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Quiz ID: <span className="font-mono">{attempt.quizId}</span></span>
                            <Link to="/home" className="btn-primary">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                Take Another Quiz
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Questions Review */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 text-center">Question Review</h2>
                    {attempt.questions.map((q, i) => {
                        const chosenId = attempt.answers[q.id] ?? "";
                        const correctId = q.answer;
                        const isCorrect = chosenId === correctId;

                        return (
                            <div key={q.id} className="card p-6 animate-fade-in">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                            isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {i + 1}
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {q.prompt}
                                        </h3>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        isCorrect 
                                            ? "bg-green-100 text-green-700" 
                                            : "bg-red-100 text-red-700"
                                    }`}>
                                        {isCorrect ? "Correct" : "Incorrect"}
                                    </span>
                                </div>

                                {q.options.length > 0 ? (
                                    <div className="space-y-3">
                                        {q.options.map((opt, optIndex) => {
                                            const optionLetter = String.fromCharCode(65 + optIndex);
                                            const isChosen = chosenId === opt.id;
                                            const isCorrectAnswer = correctId === opt.id;
                                            
                                            return (
                                                <div
                                                    key={opt.id}
                                                    className={`p-4 rounded-lg border-2 ${
                                                        isCorrectAnswer
                                                            ? "bg-green-50 border-green-500"
                                                            : isChosen && !isCorrect
                                                            ? "bg-red-50 border-red-500"
                                                            : "bg-gray-50 border-gray-200"
                                                    }`}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                                                            isCorrectAnswer
                                                                ? "bg-green-500 text-white"
                                                                : isChosen && !isCorrect
                                                                ? "bg-red-500 text-white"
                                                                : "bg-gray-300 text-gray-600"
                                                        }`}>
                                                            {optionLetter}
                                                        </div>
                                                        <span className="flex-1">{opt.text}</span>
                                                        {isCorrectAnswer && (
                                                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                        {isChosen && !isCorrect && (
                                                            <span className="text-red-600 text-sm font-medium">Your answer</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                                        <div>
                                            Correct answer ID: <span className="font-mono">{correctId || "(unknown)"}</span>
                                        </div>
                                        <div>
                                            Your answer ID: <span className="font-mono">{chosenId || "(none)"}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}