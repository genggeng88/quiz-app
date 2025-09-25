// src/lib/quiz.ts
import { api } from "../services/auth";

export type Category = "Math" | "Physics" | "Chemistry" | "Computer Science";
export const CATEGORIES: Category[] = ["Math", "Physics", "Chemistry", "Computer Science"];

export const CATEGORY_NAME_TO_ID: Record<Category, number> = {
    Math: 1,
    Physics: 2,
    Chemistry: 3,
    "Computer Science": 4,
};
export const CATEGORY_ID_TO_NAME: Record<number, Category> = {
    1: "Math",
    2: "Physics",
    3: "Chemistry",
    4: "Computer Science",
};

const toCategoryName = (raw: any): Category => {
    if (raw == null) return "Math";
    if (typeof raw === "number") return CATEGORY_ID_TO_NAME[raw] ?? "Math";
    return (raw as Category);
};

// ----- Types -----
export type Option = { id: string; text: string };

export type Question = {
    id: string;
    prompt: string;
    options: Option[];     // ← keep choice IDs here
    answer: string;        // optional if you later show correct answers
};

export type AttemptDetail = {
    quizId: string;
    category: Category;
    createdAtISO: string;
    timeTakenSec: number;
    correctRate: number; // 0..1
    questions: Question[];
    answers: Record<string, string>;
    userEmail: string;
    userFullName: string;
};

type GenResp = { ok?: boolean; data?: any[]; questions?: any[]; error?: string };
type SubmitResp = { ok?: boolean; data: { quizId: string | number; score?: number }; error?: string };
type SummariesResp = { ok?: boolean; data: any[]; error?: string };
type ResultResp = {
    ok?: boolean;
    data?: {
        quiz?: any;
        items?: any[];
        correctness_rate?: number;
    };
    error?: string;
};

// ----- Local "open quiz" helpers -----
const OPEN_KEY = "openQuiz";

export function setOpenQuiz(info: { url: string; category: Category; startedAtISO: string }) {
    try { localStorage.setItem(OPEN_KEY, JSON.stringify(info)); } catch { }
}
export function clearOpenQuiz() {
    try { localStorage.removeItem(OPEN_KEY); } catch { }
}
export function getOpenQuiz():
    | { url: string; category: Category; startedAtISO: string }
    | null {
    try {
        const raw = localStorage.getItem(OPEN_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

// ----- API calls -----

// Generate a new quiz (fetch 5 random questions for a category)
export async function generateQuiz(category: Category): Promise<Question[]> {
    const categoryId = CATEGORY_NAME_TO_ID[category];
    // const res = await fetch(
    //     `${BASE_URL}/quiz?categoryId=${encodeURIComponent(String(categoryId))}`,
    //     { credentials: "include" }
    // );
    const data = await api<GenResp>(`/quiz?categoryId=${encodeURIComponent(String(categoryId))}`);
    if (!data.ok || !data?.ok) throw new Error("Failed to generate quiz");

    const list: any[] = data.data ?? data.questions ?? [];
    return list.map((q: any) => ({
        id: String(q.questionId ?? q.question_id ?? q.id),
        prompt: String(q.question ?? q.prompt ?? ""),
        options: (q.options ?? []).map((opt: any) => ({
            id: String(opt.choiceId ?? opt.choice_id ?? opt.id ?? opt.value),
            text: String(opt.description ?? opt.text ?? opt.label ?? opt.value),
        })),
        answer: "",
    }));
}

// Submit a quiz attempt
export async function submitQuiz(
    category: Category,
    answers: Record<string, string>,
    times?: { timeStart?: string; timeEnd?: string }   // ← add this
): Promise<{ quizId: string; score: number }> {
    const categoryId = CATEGORY_NAME_TO_ID[category];
    const payload: any = {
        answers: Object.entries(answers).map(([questionId, choiceId]) => ({
            questionId: Number(questionId),
            choiceId: Number(choiceId),
        })),
        categoryId,
    };
    if (times?.timeStart) payload.timeStart = times.timeStart;
    if (times?.timeEnd) payload.timeEnd = times.timeEnd;

    // const res = await fetch(
    //     `${BASE_URL}/quiz?categoryId=${encodeURIComponent(String(categoryId))}`,
    //     {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         credentials: "include",
    //         body: JSON.stringify(payload),
    //     }
    // );
    // const data = await res.json();

    const data = await api<SubmitResp>(`/quiz?categoryId=${encodeURIComponent(String(categoryId))}`, {
        method: "POST",
        body: JSON.stringify(payload),
        // Content-Type is auto-set in api() unless body is FormData
    });
    if (data?.ok === false) throw new Error(data?.error || "Failed to submit quiz");
    return {
        quizId: String(data.data.quizId),
        score: Number(data.data.score ?? 0)
    };
}

export async function fetchQuizSummaries(): Promise<AttemptDetail[]> {
    // const res = await fetch(`${BASE_URL}/quiz/result`, {
    //     credentials: "include",
    // });
    // const data = await res.json();
    // if (!res.ok || !data.ok) throw new Error(data?.error || "Failed to fetch quiz summaries");
    const data = await api<SummariesResp>("/quiz/result");
    if (data?.ok === false) throw new Error(data?.error || "Failed to fetch quiz summaries");

    return data.data.map((quiz: any) => ({
        quizId: quiz.quiz_id.toString(),
        category: quiz.category_id,
        createdAtISO: quiz.time_start,
        timeTakenSec: quiz.time_end && quiz.time_start
            ? Math.floor((new Date(quiz.time_end).getTime() - new Date(quiz.time_start).getTime()) / 1000)
            : 0,
        correctRate: quiz.correct_rate ?? 0,
        questions: [],
        answers: {},
        userEmail: "",      // Fill if backend provides
        userFullName: "",   // Fill if backend provides
    }));
}

// src/lib/quiz.ts
export async function fetchQuizResult(quizId: number): Promise<AttemptDetail> {
    // const res = await fetch(`${BASE_URL}/quiz/result/${quizId}`, {
    //     credentials: "include",
    // });
    // const data = await res.json();
    // if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to fetch quiz result");

    const data = await api<ResultResp>(`/quiz/result/${quizId}`);
    if (data?.ok === false) throw new Error(data?.error || "Failed to fetch quiz result");

    const quiz = data.data?.quiz ?? {};
    const rows: any[] = data.data?.items ?? [];

    type QBuild = { id: string; prompt: string; options: Option[]; answer: string };
    const qMap = new Map<string, QBuild>();
    const answers: Record<string, string> = {};

    for (const r of rows) {
        const qid = String(r.question_id);
        if (!qid) continue;

        // create question bucket
        let qb = qMap.get(qid);
        if (!qb) {
            qb = { id: qid, prompt: String(r.question ?? ""), options: [], answer: "" };
            qMap.set(qid, qb);
        }

        // add option from this row (dedupe)
        const choiceId = String(r.choice_id);
        const text = String(r.option_desc ?? "");
        if (!qb.options.some(o => o.id === choiceId)) {
            qb.options.push({ id: choiceId, text });
        }

        // correct answer lives on the row where is_correct === true
        if (r.is_correct === true) {
            qb.answer = choiceId;
        }

        // user's choice (same across the 4 rows)
        if (r.user_choice_id != null && answers[qid] == null) {
            answers[qid] = String(r.user_choice_id);
        }
    }

    const questions = Array.from(qMap.values());

    // correct rate: prefer backend, else compute
    const computed =
        questions.filter(q => q.answer && answers[q.id] === q.answer).length /
        Math.max(1, questions.length);

    const correctRate =
        typeof quiz.correct_rate === "number"
            ? quiz.correct_rate
            : typeof data.data?.correctness_rate === "number"
                ? data.data.correctness_rate
                : computed;

    const category = toCategoryName(quiz.category ?? quiz.category_id);

    const timeTakenSec =
        quiz.time_end && quiz.time_start
            ? Math.floor((new Date(quiz.time_end).getTime() - new Date(quiz.time_start).getTime()) / 1000)
            : 0;

    return {
        quizId: String(quiz.quiz_id ?? quizId),
        category,
        createdAtISO: String(quiz.time_start ?? ""),
        timeTakenSec,
        correctRate,
        questions,
        answers,
        userEmail: "",      // not provided by payload
        userFullName: "",   // not provided by payload
    };
}
