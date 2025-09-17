export type UserRow = {
    user_id: number;
    email: string;
    full_name: string;
    role: "user" | "admin";
    status: "active" | "suspended";
};

export type QuizRow = {
    quiz_id: number;
    time_start: string;
    time_end: string;
    correct_rate: number;
    user_id: number;
    user_full_name: string;
    user_email: string;
    category_id: number;
    category: string;
    question_count: number;
};

export type QuestionRow = {
    question_id: number;
    question: string;       // text/description
    category_id: number;
    category: string;
    is_active: boolean;
};

export type ChoiceDTO = {
    choiceId?: number;
    description: string;
    isCorrect: boolean;
};

export type QuestionDetail = QuestionRow & {
    choices: Array<{
        choice_id: number;
        description: string;
        is_correct: boolean;
    }>
};

export type ContactRow = {
    contact_id: number;
    subject: string;
    email: string;
    time: string;
    message: string;
};
