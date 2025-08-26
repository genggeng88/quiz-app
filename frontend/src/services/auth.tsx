// src/services/auth.ts
export type Role = "admin" | "user";
export type Status = "active" | "suspended";

export type User = {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    status: Status;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

type StoredUser = { id: string; password: string; role?: Role; fullName?: string; status?: Status };

export async function login(email: string, password: string): Promise<User> {
    await delay(150);
    const usersRaw = localStorage.getItem("users");
    const users: Record<string, StoredUser> = usersRaw ? JSON.parse(usersRaw) : {};
    const existing = users[email];
    if (!existing) throw new Error("No user found with that email.");
    if (existing.password !== password) throw new Error("Incorrect password.");

    const user: User = {
        id: existing.id,
        email,
        fullName: existing.fullName ?? email.split("@")[0],
        role: existing.role ?? "user",
        status: existing.status ?? "active",
    };
    localStorage.setItem("session", JSON.stringify(user));
    return user;
}

export async function register(email: string, password: string, fullName?: string): Promise<User> {
    await delay(150);
    const usersRaw = localStorage.getItem("users");
    const users: Record<string, StoredUser> = usersRaw ? JSON.parse(usersRaw) : {};
    if (users[email]) throw new Error("Email is already registered.");

    const id = crypto?.randomUUID?.() ?? String(Date.now());
    users[email] = {
        id,
        password,
        role: "user",
        fullName: fullName ?? email.split("@")[0],
        status: "active",
    };
    localStorage.setItem("users", JSON.stringify(users));

    const user: User = {
        id,
        email,
        fullName: users[email].fullName!,
        role: "user",
        status: "active",
    };
    localStorage.setItem("session", JSON.stringify(user));
    return user;
}

export function getCurrentUser(): User | null {
    const raw = localStorage.getItem("session");
    return raw ? JSON.parse(raw) : null;
}

export function setRole(email: string, role: Role) {
    const usersRaw = localStorage.getItem("users");
    const users: Record<string, StoredUser> = usersRaw ? JSON.parse(usersRaw) : {};
    if (!users[email]) return;
    users[email].role = role;
    localStorage.setItem("users", JSON.stringify(users));
    const sRaw = localStorage.getItem("session");
    if (sRaw) {
        const s = JSON.parse(sRaw) as User;
        if (s.email === email) {
            s.role = role;
            localStorage.setItem("session", JSON.stringify(s));
        }
    }
}

export function listAllUsers(): User[] {
    const usersRaw = localStorage.getItem("users");
    const users: Record<string, StoredUser> = usersRaw ? JSON.parse(usersRaw) : {};
    return Object.entries(users).map(([email, u]) => ({
        id: u.id,
        email,
        fullName: u.fullName ?? email.split("@")[0],
        role: u.role ?? "user",
        status: u.status ?? "active",
    }));
}

export function setUserStatus(email: string, status: Status) {
    const usersRaw = localStorage.getItem("users");
    const users: Record<string, StoredUser> = usersRaw ? JSON.parse(usersRaw) : {};
    if (!users[email]) return;
    users[email].status = status;
    localStorage.setItem("users", JSON.stringify(users));

    const sRaw = localStorage.getItem("session");
    if (sRaw) {
        const s = JSON.parse(sRaw) as User;
        if (s.email === email) {
            s.status = status;
            localStorage.setItem("session", JSON.stringify(s));
        }
    }
}

export function logout() {
    localStorage.removeItem("session");
}
