// src/pages/Home.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES, fetchQuizSummaries } from "../lib/quiz";
import type { Category, AttemptDetail } from "../lib/quiz";
import { getCurrentUser } from "../services/auth";

function formatSeconds(sec: number) {
    const total = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}m ${String(s).padStart(2, "0")}s`;
}

export default function Home() {
    const navigate = useNavigate();
    const user = getCurrentUser();

    // robust admin detection
    const isAdmin =
        user?.is_admin === true ||
        (typeof user?.role === "string" && user.role.toLowerCase() === "admin");

    // user-home state (declare hooks unconditionally)
    const [category, setCategory] = useState<Category>(CATEGORIES[0] as Category);
    const [recent, setRecent] = useState<AttemptDetail[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            // admin: make sure no stale user data shows
            setRecent([]);
            setLoading(false);
            return;
        }
        let alive = true;
        setLoading(true);
        fetchQuizSummaries()
            .then(d => { if (alive) setRecent(d ?? []); })
            .catch(() => { if (alive) setRecent([]); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [isAdmin]);

    if (isAdmin) {
        // ----- ADMIN HOME ONLY -----
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
                {/* Main Content Container - Centered */}
                <div className="flex flex-col min-h-screen">
                    {/* Content Area - Centered */}
                    <div className="flex-1 flex items-center justify-center p-6">
                        <div className="w-full max-w-6xl mx-auto text-center">
                            {/* Hero Section */}
                            <div className="text-center mb-12">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl mb-6 shadow-lg">
                                    <span className="text-white text-3xl font-bold">A</span>
                                </div>
                                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                                    Admin Dashboard
                                </h1>
                                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                                    Welcome back, <span className="font-semibold text-blue-600">{user?.email ?? "Admin"}</span>
                                    <span className="ml-3 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                                        ADMIN
                                    </span>
                                </p>
                            </div>

                            {/* Admin Cards */}
                            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <AdminCard 
                                    to="/admin/users" 
                                    label="User Management" 
                                    description="Manage user accounts and permissions"
                                    icon="users"
                                />
                                <AdminCard 
                                    to="/admin/quiz-results" 
                                    label="Quiz Results" 
                                    description="View and analyze quiz performance"
                                    icon="chart"
                                />
                                <AdminCard 
                                    to="/admin/questions" 
                                    label="Question Bank" 
                                    description="Create and manage quiz questions"
                                    icon="book"
                                />
                                <AdminCard 
                                    to="/admin/contacts" 
                                    label="Contact Management" 
                                    description="Handle user inquiries and support"
                                    icon="mail"
                                />
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ----- USER HOME ONLY -----
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Main Content Container - Centered */}
            <div className="flex flex-col min-h-screen">
                {/* Content Area - Centered */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-4xl mx-auto text-center">
                        {/* Hero Section */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl mb-6 shadow-lg">
                                <span className="text-white text-3xl font-bold">Q</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                                Welcome to Quiz App
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                                Hello, <span className="font-semibold text-blue-600">{user?.email ?? "Guest"}</span>! 
                                Ready to test your knowledge and challenge yourself?
                            </p>
                            
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                                    <div className="text-3xl font-bold text-blue-600 mb-2">{recent.length}</div>
                                    <div className="text-gray-600">Quizzes Completed</div>
                                </div>
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                                    <div className="text-3xl font-bold text-green-600 mb-2">
                                        {recent.length > 0 ? Math.round(recent.reduce((acc, q) => acc + q.correctRate, 0) / recent.length * 100) : 0}%
                                    </div>
                                    <div className="text-gray-600">Average Score</div>
                                </div>
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                                    <div className="text-3xl font-bold text-purple-600 mb-2">{CATEGORIES.length}</div>
                                    <div className="text-gray-600">Categories Available</div>
                                </div>
                            </div>
                        </div>

                        {/* Start Quiz Section */}
                        <section className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4">
                                    <span className="text-white text-2xl">🚀</span>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-3">Start a New Quiz</h2>
                                <p className="text-lg text-gray-600">Choose a category and begin your learning journey</p>
                            </div>
                            
                            <div className="max-w-2xl mx-auto">
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                                        <div className="flex items-center gap-3">
                                            <label htmlFor="category" className="text-lg font-semibold text-gray-700">Category:</label>
                                            <select
                                                id="category"
                                                className="form-input w-auto min-w-[200px] text-lg py-3"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value as Category)}
                                            >
                                                {CATEGORIES.map((c) => (
                                                    <option value={c} key={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <button
                                        onClick={() => navigate(`/quiz/${encodeURIComponent(category)}`)}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                                    >
                                        <span className="mr-3 text-2xl">🎯</span>
                                        Start Quiz
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Recent Quiz Summary */}
                        <section className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-4">
                                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                                        <span className="text-white text-xl">📊</span>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-900">Recent Quiz Results</h2>
                                        <p className="text-lg text-gray-600">Track your progress and review past attempts</p>
                                    </div>
                                </div>
                                {recent.length > 0 && (
                                    <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full">
                                        <span className="text-sm font-semibold text-blue-700">
                                            {recent.length} attempt{recent.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                    
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex items-center space-x-2 text-gray-500">
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Loading your quiz history...</span>
                                </div>
                            </div>
                        ) : recent.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl text-gray-300 mx-auto mb-4">📝</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No quiz attempts yet</h3>
                                <p className="text-gray-500 mb-4">Start your first quiz to see your results here</p>
                                <button
                                    onClick={() => navigate(`/quiz/${encodeURIComponent(category)}`)}
                                    className="btn-primary"
                                >
                                    Take Your First Quiz
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {recent.map((q, index) => (
                                    <div key={q.quizId} className="bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-4 mb-3">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                            <span className="text-white font-bold text-sm">#{index + 1}</span>
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{q.category}</div>
                                                            <div className="text-sm text-gray-500">{formatSeconds(q.timeTakenSec)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-sm text-gray-500">Score:</span>
                                                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                                q.correctRate >= 0.8 
                                                                    ? 'bg-green-100 text-green-700' 
                                                                    : q.correctRate >= 0.6 
                                                                    ? 'bg-yellow-100 text-yellow-700' 
                                                                    : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                {(q.correctRate * 100).toFixed(0)}%
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                                                            {q.quizId.slice(0, 8)}...
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                                                        onClick={() => navigate(`/quiz/result/${q.quizId}`)}
                                                    >
                                                        <span className="mr-2">👁️</span>
                                                        Review
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}



function AdminCard({ to, label, description, icon }: { 
    to: string; 
    label: string; 
    description: string;
    icon: string;
}) {
    const getIcon = (iconName: string) => {
        const iconProps = "w-8 h-8 text-blue-600";
        switch (iconName) {
            case 'users':
                return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>;
            case 'chart':
                return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>;
            case 'book':
                return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>;
            case 'mail':
                return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>;
            default:
                return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>;
        }
    };

    return (
        <Link to={to} className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 group border border-white/20 hover:border-blue-200 transform hover:-translate-y-2">
            <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300 shadow-lg">
                    {getIcon(icon)}
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{label}</h3>
                    <p className="text-gray-600 leading-relaxed">{description}</p>
                </div>
                <div className="flex items-center text-blue-600 text-sm font-semibold group-hover:text-blue-700 bg-blue-50 group-hover:bg-blue-100 px-4 py-2 rounded-full transition-all duration-300">
                    <span>Manage</span>
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
            </div>
        </Link>
    );
}
