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

type ChoiceWire = {
    choiceId: number;
    description: string;
};

type QuestionWire = {
    question_id: number;
    question: string;
    options: ChoiceWire[];
};

type AnswerWire = { questionId: number; choiceId: number };

export type SubmitPayload = {
    categoryId: number;
    answers: AnswerWire[];
    timeStart?: string;
    timeEnd?: string;
};

// api() returns the INNER object, so model just that
export type SubmitResultWire = {
    quizId?: number | string;
    score?: number;
    timeStart?: string;
    timeEnd?: string;
    durationSec?: number;
};

export type SummaryWire = {
    quiz_id: number;
    user_id: number;
    category_id: number;
    name?: string;
    time_start: string;
    time_end: string | null;
    correct_rate: number;
};

type QuizMetaWire = {
    quiz_id: number;
    user_id?: number;
    category_id: number;
    name?: string;
    time_start: string;                  // ISO
    time_end?: string | null;            // ISO or null
    correct_rate?: number;               // 0.0 ~ 1.0
};

export type QuizRowWire = {
    question_id: number;
    question: string;
    choice_id: number;
    option_desc: string;
    is_correct: boolean;
    user_choice_id: number | null;
};

type ResultDetailWire = {
    quiz: QuizMetaWire;
    items: QuizRowWire[];
    correctness_rate?: number;
};

type Option = { id: string; text: string };

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

    console.log("generateQuiz(): categoryId=", categoryId);
    const rows = await api<QuestionWire[]>(
        `/quiz?categoryId=${encodeURIComponent(String(categoryId))}`
    );
    console.log("generateQuiz(): rows=", rows);
    if (!Array.isArray(rows)) {
        throw new Error("Bad response: expected an array of questions");
    }

    return rows.map((q) => ({
        id: String(q.question_id),
        prompt: q.question,
        options: (q.options ?? []).map((opt) => ({
            id: String(opt.choiceId),
            text: opt.description,
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
    const payload: SubmitPayload = {
        categoryId,
        answers: Object.entries(answers).map(([qId, cId]) => ({
            questionId: Number(qId),
            choiceId: Number(cId),
        })),
        ...(times?.timeStart ? { timeStart: times.timeStart } : {}),
        ...(times?.timeEnd ? { timeEnd: times.timeEnd } : {}),
    };

    const res = await api<SubmitResultWire>(`/quiz?categoryId=${categoryId}`, {
        method: "POST",
        body: JSON.stringify(payload),
        // Content-Type is auto-set in api() unless body is FormData
    });

    return {
        quizId: String(res.quizId),
        score: Number(res.score ?? 0),
    };
}

export async function fetchQuizSummaries(): Promise<AttemptDetail[]> {
    console.log("trying to fetch quiz summary by calling api<>")
    const rows = await api<SummaryWire[]>("/quiz/result");
    return rows.map((r) => ({
        quizId: String(r.quiz_id),
        category: toCategoryName(r.category_id),
        createdAtISO: r.time_start,
        timeTakenSec:
            r.time_end
                ? Math.floor(
                    (new Date(r.time_end).getTime() - new Date(r.time_start).getTime()) / 1000
                )
                : 0,
        correctRate: Number(r.correct_rate ?? 0),
        questions: [],
        answers: {},
        userEmail: "",
        userFullName: "",
    }));
}

// src/lib/quiz.ts
export async function fetchQuizResult(quizId: number): Promise<AttemptDetail> {
    const resp = await api<ResultDetailWire | QuizRowWire[] | QuizMetaWire>(`/quiz/result/${quizId}`);

    let meta: QuizMetaWire | undefined;
    let rows: QuizRowWire[] = [];

    if (Array.isArray(resp)) {
        // rows-only payload
        rows = resp;
    } else if ((resp as any)?.quiz && Array.isArray((resp as any)?.items)) {
        // detail payload with quiz + items
        const d = resp as ResultDetailWire;
        meta = d.quiz;
        rows = d.items ?? [];
    } else {
        // summary-only payload
        meta = resp as QuizMetaWire;
    }

    // Build questions & answers if rows exist
    type QBuild = { id: string; prompt: string; options: Option[]; answer: string };
    const qMap = new Map<string, QBuild>();
    const answers: Record<string, string> = {};

    for (const r of rows) {
        const qid = String(r.question_id);
        if (!qid) continue;

        let qb = qMap.get(qid);
        if (!qb) {
            qb = { id: qid, prompt: String(r.question ?? ""), options: [], answer: "" };
            qMap.set(qid, qb);
        }

        const choiceId = String(r.choice_id);
        const text = String(r.option_desc ?? "");
        if (!qb.options.some(o => o.id === choiceId)) {
            qb.options.push({ id: choiceId, text });
        }

        if (r.is_correct === true) qb.answer = choiceId;

        if (r.user_choice_id != null && answers[qid] == null) {
            answers[qid] = String(r.user_choice_id);
        }
    }

    const questions = Array.from(qMap.values());

    // Compute correctness if not provided
    const computed =
        questions.length === 0
            ? 0
            : questions.filter(q => q.answer && answers[q.id] === q.answer).length / questions.length;

    const correctRate =
        (meta?.correct_rate ??
            (typeof (resp as any)?.correctness_rate === "number" ? (resp as any).correctness_rate : undefined) ??
            computed) || 0;

    const categoryId = meta?.category_id;
    const category: Category =
        categoryId != null ? toCategoryName(categoryId) : CATEGORIES[0];

    const timeTakenSec =
        meta?.time_end && meta?.time_start
            ? Math.floor(
                (new Date(meta.time_end).getTime() - new Date(meta.time_start).getTime()) / 1000
            )
            : 0;

    return {
        quizId: String(meta?.quiz_id ?? quizId),
        category,
        createdAtISO: String(meta?.time_start ?? ""),
        timeTakenSec,
        correctRate,
        questions,       // will be [] if endpoint returned only summary/meta
        answers,         // {} if no rows
        userEmail: "",   // not provided by payload
        userFullName: "",// not provided by payload
    };
}