// src/services/auth.ts

export type Role = "admin" | "user";
export type Status = "active" | "suspended";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SESSION_KEY = "session";
const TOKEN_KEY = "auth:token";
const AUTH_EVENT = "auth-changed";

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

function emitAuthChanged() {
    window.dispatchEvent(new Event(AUTH_EVENT));
}

export function setSession(user: User | null) {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
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

export function setToken(token: string | null) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    emitAuthChanged();
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

type LoginData = { user: any; token: string };

export async function login(email: string, password: string): Promise<User> {
    const { user: raw, token } = await api<LoginData>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
    });
    const user = normalizeUser(raw);
    setSession(user);
    setToken(token);
    return user;
}

export async function refreshToken(): Promise<User | null> {
    try {
        const data = await api<{ user: any; token?: string }>("/auth/refresh", { method: "POST" });
        if (data?.token) setToken(data.token);
        const user = normalizeUser(data.user);
        setSession(user);
        return user;
    } catch {
        setToken(null);
        setSession(null);
        return null;
    }
}

export async function register(opts: {
    email: string; password: string;
    firstName?: string; lastName?: string;
    isAdmin?: boolean; isActive?: boolean;
}) {
    const payload = {
        email: opts.email,
        password: opts.password,
        firstname: opts.firstName ?? "",   // match your backend's expected keys
        lastname: opts.lastName ?? "",
        is_active: opts.isActive ?? true,  // booleans, not "True"/"False"
        is_admin: opts.isAdmin ?? false,
    };
    const res = await api<{ message?: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return { ok: true as const, message: String(res?.["message"] || "User registered successfully") };
}

export async function logout() {
    try {
        await api<void>("/auth/logout", { method: "POST" }); // optional on stateless JWT
    } catch { /* ignore */ }
    setToken(null);
    setSession(null);
}


function join(path: string) {
    return path.startsWith("http")
        ? path
        : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers || {});
    const hasJsonBody = init.body !== undefined && !(init.body instanceof FormData);
    if (hasJsonBody && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

    // attach Authorization for header-based JWT
    if (!headers.has("Authorization")) {
        const tok = getToken();
        if (tok) headers.set("Authorization", `Bearer ${tok}`);
    }

    const res = await fetch(join(path), { ...init, headers }); // no credentials: 'include'
    const ct = res.headers.get("content-type") || "";
    const parsed = ct.includes("application/json") ? await res.json() : undefined;

    if (!res.ok || (parsed && parsed.ok === false)) {
        const msg = parsed?.error || parsed?.message || `${res.status} ${res.statusText}`;
        if (res.status === 401) setToken(null);
        throw new Error(msg);
    }
    return (parsed && "data" in parsed ? parsed.data : parsed) as T;
}