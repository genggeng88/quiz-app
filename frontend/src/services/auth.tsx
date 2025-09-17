import type { Register } from "react-router-dom";

// src/services/auth.ts
export type Role = "admin" | "user";
export type Status = "active" | "suspended";

export type User = {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    status: Status;
    firstName?: string;
    lastName?: string;
    is_admin?: boolean;
};

export type RegisterResult = { ok: true; message: string };

const SESSION_KEY = "session";
const TOKEN_KEY = "auth:token";
const AUTH_EVENT = "auth-changed";

function emitAuthChanged() {
    window.dispatchEvent(new Event(AUTH_EVENT));
}

function setSession(user: User | null) {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
    emitAuthChanged();
}

function setToken(token: string | null) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    emitAuthChanged();
}

export function getCurrentUser(): User | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function authHeaders(): Record<string, string> {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// React: subscribe with useSyncExternalStore
export function subscribeAuth(onChange: () => void) {
    const h = () => onChange();
    window.addEventListener(AUTH_EVENT, h);
    window.addEventListener("storage", h); // cross-tab sync
    return () => {
        window.removeEventListener(AUTH_EVENT, h);
        window.removeEventListener("storage", h);
    };
}

function normalizeUser(raw: any): User {
    const first = raw.firstName ?? raw.fisrtname ?? raw.first_name ?? "";
    const last = raw.lastName ?? raw.lastName ?? raw.last_name ?? "";
    const parts = [first, last].filter(Boolean).join(" ");
    const full =
        raw.fullName ??
        raw.fullname ??
        (parts || raw.name || raw.email || "");

    const isAdmin = raw.is_admin ?? raw.isAdmin ?? String(raw.role ?? "").toLowerCase() === "admin";
    const isActive = raw.is_active ?? raw.isActive ?? String(raw.status ?? "active").toLowerCase() === "active";

    return {
        id: String(raw.id),
        email: String(raw.email),
        firstName: first || undefined,
        lastName: last || undefined,
        fullName: full || "",
        role: isAdmin ? "admin" : "user",
        status: isActive ? "active" : "suspended",
    };
}

export async function login(email: string, password: string): Promise<User> {
    const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // important for cookies!
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
        throw new Error(data?.data?.message || data?.message || "Login failed");
    }

    const user = normalizeUser(data.data?.user ?? data.user ?? {});
    const token = String(data.data?.token ?? data.token ?? "");

    setSession(user);
    setToken(token);
    return user;
}

export async function refreshToken(): Promise<User | null> {
    const res = await fetch("http://localhost:4000/auth/refresh", {
        credentials: "include", // important for cookies!
        headers: { ...authHeaders() },
    });
    if (!res.ok) {
        setSession(null);
        return null;
    }
    const data = await res.json();
    if (!data?.ok) {
        setSession(null);
        return null;
    }

    const user = normalizeUser(data.data?.user ?? data.user ?? {});
    setSession(user);
    return user;
}

export async function register(opts: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    isAdmin?: boolean;
    isActive?: boolean;
}): Promise<RegisterResult> {
    const payload = {
        email: opts.email,
        password: opts.password,
        firstName: opts.firstName ?? "",
        lastName: opts.lastName ?? "",
        is_active: (opts.isActive ?? true) ? "True" : "False",
        is_admin: (opts.isAdmin ?? false) ? "True" : "False",
    }

    const res = await fetch("http://localhost:4000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
        throw new Error(data?.data?.message || data?.message || "Registration failed");
    }
    return { ok: true, message: String(data.message || "User registered successfully") }

}


export async function logout() {
    try {
        await fetch("http://localhost:4000/auth/logout", {
            method: "POST",
            credentials: "include",
            headers: { ...authHeaders() },
        });
    } catch {
        // ignore
    } finally {
        setToken(null);
        setSession(null);
    }
}
