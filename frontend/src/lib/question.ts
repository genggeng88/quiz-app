// src/lib/questions.ts
import { CATEGORIES } from "./quiz";
import type { Category } from "./quiz";

export type QuestionStatus = "active" | "suspended";

export type ManagedQuestion = {
    id: string;
    category: Category;
    description: string;
    options: string[];      // 4 options
    answer: string;         // must be in options
    status: QuestionStatus;
    updatedAtISO: string;
};

const KEY = "managed_questions";

const uuid = () =>
    (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`.replace(".", "");

export function listQuestions(): ManagedQuestion[] {
    const raw = localStorage.getItem(KEY);
    const arr: ManagedQuestion[] = raw ? JSON.parse(raw) : [];
    // ensure categories valid if you changed CATEGORIES later
    return arr.filter(q => (CATEGORIES as readonly string[]).includes(q.category));
}

export function saveQuestions(all: ManagedQuestion[]) {
    localStorage.setItem(KEY, JSON.stringify(all));
}

export function addQuestion(q: Omit<ManagedQuestion, "id" | "updatedAtISO">): ManagedQuestion {
    const all = listQuestions();
    const item: ManagedQuestion = { ...q, id: uuid(), updatedAtISO: new Date().toISOString() };
    all.unshift(item);
    saveQuestions(all);
    return item;
}

export function getQuestion(id: string): ManagedQuestion | null {
    return listQuestions().find(q => q.id === id) ?? null;
}

export function updateQuestion(id: string, patch: Partial<ManagedQuestion>) {
    const all = listQuestions();
    const i = all.findIndex(q => q.id === id);
    if (i === -1) return;
    all[i] = { ...all[i], ...patch, updatedAtISO: new Date().toISOString() };
    saveQuestions(all);
}

export function toggleQuestionStatus(id: string) {
    const q = getQuestion(id);
    if (!q) return;
    updateQuestion(id, { status: q.status === "active" ? "suspended" : "active" });
}
