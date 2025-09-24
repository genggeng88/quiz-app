import { api } from "./auth";
import type {
    UserRow, QuizRow, QuestionRow, QuestionDetail, ChoiceDTO, ContactRow
} from "../types/admin";

// Users
export const listUsers = () => api<UserRow[]>("/admin/users");
export const setUserStatus = (userId: number, status: "active" | "suspended") =>
    api<UserRow>(`/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });

// Quizzes
export const listQuizzes = (params?: { categoryId?: number; userId?: number; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.categoryId != null) q.set("categoryId", String(params.categoryId));
    if (params?.userId != null) q.set("userId", String(params.userId));
    if (params?.limit != null) q.set("limit", String(params.limit));
    if (params?.offset != null) q.set("offset", String(params.offset));
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return api<QuizRow[]>(`/admin/quizzes${suffix}`);
};

// Questions
export const listQuestions = (params?: { categoryId?: number; q?: string; includeChoices?: boolean; limit?: number; offset?: number }) => {
    const s = new URLSearchParams();
    if (params?.categoryId != null) s.set("categoryId", String(params.categoryId));
    if (params?.q) s.set("q", params.q);
    if (params?.includeChoices) s.set("includeChoices", "true");
    if (params?.limit != null) s.set("limit", String(params.limit));
    if (params?.offset != null) s.set("offset", String(params.offset));
    const suffix = s.toString() ? `?${s.toString()}` : "";
    return api<QuestionRow[]>(`/admin/questions${suffix}`);
};
export const getQuestion = (id: number) => api<QuestionDetail>(`/admin/questions/${id}`);

// Whole update (PUT)
export const putQuestion = (id: number, payload: {
    description: string;
    categoryId: number;
    isActive: boolean;
    choices: ChoiceDTO[];
}) => api<unknown>(`/admin/questions/${id}`, { method: "PUT", body: JSON.stringify(payload) });

// Create
export const createQuestion = (payload: {
    description: string;
    categoryId: number;
    choices: Array<{ description: string; isCorrect: boolean }>;
}) => api<{ question_id: number }>(`/admin/questions`, { method: "POST", body: JSON.stringify(payload) });

export const setQuestionStatus = (id: number, isActive: boolean) =>
    api<{ question_id: number; is_active: boolean }>(`/admin/questions/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
    });

// Contacts
export const listContacts = () => api<ContactRow[]>("/contact");                 // admin-protected
export const getContact = (id: number) => api<ContactRow>(`/contact/${id}`);     // admin-protected
