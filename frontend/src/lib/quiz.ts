// src/lib/quiz.ts
export type Category = "Math" | "Physics" | "Chemistry" | "Computer Science";
export const CATEGORIES: Category[] = ["Math", "Physics", "Chemistry", "Computer Science"];

export type Question = {
    id: string;
    prompt: string;
    options: string[];
    answer: string;
};

export type AttemptDetail = {
    quizId: string;
    category: Category;
    createdAtISO: string;
    timeTakenSec: number;
    correctRate: number; // 0..1
    questions: Question[];
    answers: Record<string, string>;
    // NEW: who took it
    userEmail: string;
    userFullName: string;
};

const uuid = () =>
    (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`.replace(".", "");

export function generateQuestions(category: Category): Question[] {
    const bank: Record<Category, Question[]> = {
        Math: [
            { id: "m1", prompt: "What is the derivative of x²?", options: ["x", "2x", "x²", "2"], answer: "2x" },
            { id: "m2", prompt: "What is 12 × 8?", options: ["80", "88", "96", "104"], answer: "96" },
            { id: "m3", prompt: "Solve: 2x + 6 = 0", options: ["x = 3", "x = -3", "x = -6", "x = 6"], answer: "x = -3" },
            { id: "m4", prompt: "∫ (1/x) dx = ?", options: ["x", "ln|x| + C", "e^x + C", "x²/2 + C"], answer: "ln|x| + C" },
            { id: "m5", prompt: "What is 7²?", options: ["42", "47", "49", "56"], answer: "49" },
            { id: "m6", prompt: "GCD of 18 and 24?", options: ["2", "3", "6", "12"], answer: "6" },
        ],
        Physics: [
            { id: "p1", prompt: "SI unit of force?", options: ["Joule", "Newton", "Pascal", "Watt"], answer: "Newton" },
            { id: "p2", prompt: "g near Earth ≈ ?", options: ["9.8 m/s²", "9.8 N", "9.8 m", "0.98 m/s²"], answer: "9.8 m/s²" },
            { id: "p3", prompt: "Speed of light ≈ ?", options: ["3×10^6", "3×10^8", "3×10^10", "3×10^5"], answer: "3×10^8" },
            { id: "p4", prompt: "Which is scalar?", options: ["Velocity", "Force", "Displacement", "Temperature"], answer: "Temperature" },
            { id: "p5", prompt: "Work = ?", options: ["Force × distance", "Mass × acceleration", "Power × time", "Energy × time"], answer: "Force × distance" },
            { id: "p6", prompt: "Unit of power?", options: ["Watt", "Newton", "Joule", "Pascal"], answer: "Watt" },
        ],
        Chemistry: [
            { id: "c1", prompt: "pH of neutral at 25°C?", options: ["0", "1", "7", "14"], answer: "7" },
            { id: "c2", prompt: "Avogadro’s number ≈ ?", options: ["6.02×10^23", "6.02×10^22", "6.02×10^24", "6.02×10^20"], answer: "6.02×10^23" },
            { id: "c3", prompt: "NaCl is…", options: ["Baking soda", "Table salt", "Bleach", "Epsom salt"], answer: "Table salt" },
            { id: "c4", prompt: "H₂O₂ is…", options: ["HCl", "Hydrogen peroxide", "H₂S", "Hydroxide"], answer: "Hydrogen peroxide" },
            { id: "c5", prompt: "Which is alkali metal?", options: ["Calcium", "Magnesium", "Sodium", "Aluminum"], answer: "Sodium" },
            { id: "c6", prompt: "Acids turn blue litmus…", options: ["Blue", "Red", "Green", "Yellow"], answer: "Red" },
        ],
        "Computer Science": [
            { id: "cs1", prompt: "Binary search complexity?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], answer: "O(log n)" },
            { id: "cs2", prompt: "HTTP stands for?", options: ["HyperText Transfer Protocol", "Hyperlink Text Transfer Protocol", "HyperText Transmission Process", "Host Transfer Text Protocol"], answer: "HyperText Transfer Protocol" },
            { id: "cs3", prompt: "FIFO structure?", options: ["Stack", "Queue", "Tree", "Graph"], answer: "Queue" },
            { id: "cs4", prompt: "NOT a paradigm?", options: ["Functional", "Object-Oriented", "Procedural", "Spherical"], answer: "Spherical" },
            { id: "cs5", prompt: "Iterate array once is…", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: "O(n)" },
            { id: "cs6", prompt: "A NoSQL DB?", options: ["PostgreSQL", "MongoDB", "MySQL", "SQLite"], answer: "MongoDB" },
        ],
    };
    const arr = [...bank[category]];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.abs(Math.floor((Math.sin(i * 9176 + 1337) * 1e6) % (i + 1)));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 5);
}

export function computeScore(questions: Question[], answers: Record<string, string>) {
    const correct = questions.reduce((acc, q) => acc + (answers[q.id] === q.answer ? 1 : 0), 0);
    return correct / questions.length;
}

const KEY_SUMMARIES = "quizzes";              // list of summaries
const KEY_ATTEMPT_PREFIX = "quiz_";           // quiz_<id>

export function saveAttempt(detail: AttemptDetail) {
    localStorage.setItem(KEY_ATTEMPT_PREFIX + detail.quizId, JSON.stringify(detail));
    const raw = localStorage.getItem(KEY_SUMMARIES);
    const list: AttemptDetail[] = raw ? JSON.parse(raw) : [];
    // store a lighter summary item (without heavy payload) in the list
    const summary: AttemptDetail = {
        ...detail,
        questions: [],
        answers: {},
    };
    const updated = [summary, ...list].slice(0, 200);
    localStorage.setItem(KEY_SUMMARIES, JSON.stringify(updated));
}

export function getAttempt(quizId: string): AttemptDetail | null {
    const raw = localStorage.getItem(KEY_ATTEMPT_PREFIX + quizId);
    return raw ? JSON.parse(raw) : null;
}

export function listAttempts(): AttemptDetail[] {
    const raw = localStorage.getItem(KEY_SUMMARIES);
    return raw ? JSON.parse(raw) : [];
}

export function newQuizId() {
    return uuid();
}

// --- Open quiz banner state for Navbar ---
export type OpenQuiz = { url: string; category: Category; startedAtISO: string };

const KEY_OPEN = "open_quiz";

export function setOpenQuiz(open: OpenQuiz) {
    localStorage.setItem(KEY_OPEN, JSON.stringify(open));
}
export function getOpenQuiz(): OpenQuiz | null {
    const raw = localStorage.getItem(KEY_OPEN);
    return raw ? JSON.parse(raw) : null;
}
export function clearOpenQuiz() {
    localStorage.removeItem(KEY_OPEN);
}
