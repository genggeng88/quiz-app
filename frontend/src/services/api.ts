const BASE_URL = import.meta.env.VITE_API_BASE_URL;

type ApiEnvelope<T> = { ok: boolean; data?: T; message?: string; error?: string };

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
        ...init,
    });

    const contentType = res.headers.get('Content-Type') || '';
    const body = contentType.includes("application/json")
        ? ((await res.json()) as ApiEnvelope<T>)
        : (undefined as unknown as ApiEnvelope<T>);

    if (!res.ok || (body && body.ok === false)) {
        const msg = body?.error || body?.message || (res.statusText || "Request failed");
        throw new Error(msg);
    }
    // Backend wraps payload as { ok, data }
    return (body?.data as T) ?? (undefined as unknown as T);
}


export function buildUrl(path: string, params?: Record<string, string | number | boolean>) {
    const url = new URL(path.startsWith("/") ? path : `/${path}`, BASE_URL.replace(/\/+$/, ""));
    if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    }
    return url.toString();
}