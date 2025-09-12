// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { login } from "../services/auth";

export default function Login() {
    const navigate = useNavigate();
    const { state } = useLocation() as { state?: { flash?: string } };

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setErr("Please enter a valid email.");
            return;
        }
        if (password.length < 6) {
            setErr("Password must be at least 6 characters.");
            return;
        }

        try {
            setLoading(true);
            await login(email, password);
            navigate("/home"); // redirect after login
        } catch (e: any) {
            setErr(e?.message ?? "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-2xl p-6 shadow">
                <h1 className="text-2xl font-semibold mb-4">Log in</h1>

                {/* success flash from /register */}
                {state?.flash && (
                    <div className="mb-3 rounded-md bg-green-50 p-2 text-sm text-green-700 border border-green-200">
                        {state.flash}
                    </div>
                )}

                {/* error banner */}
                {err && (
                    <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700 border border-red-200">
                        {err}
                    </div>
                )}

                <label className="block mb-2 text-sm font-medium">Email</label>
                <input
                    type="email"
                    className="w-full rounded-md border p-2 mb-4"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                />

                <label className="block mb-2 text-sm font-medium">Password</label>
                <div className="flex gap-2 mb-4">
                    <input
                        type={showPwd ? "text" : "password"}
                        className="w-full rounded-md border p-2"
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                    <button
                        type="button"
                        className="rounded-md border px-3"
                        onClick={() => setShowPwd((v) => !v)}
                        aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                        {showPwd ? "Hide" : "Show"}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md bg-black text-white py-2 disabled:opacity-60"
                >
                    {loading ? "Logging in..." : "Log in"}
                </button>

                <p className="text-sm mt-4">
                    Don’t have an account?{" "}
                    <Link to="/register" className="underline">Register</Link>
                </p>
            </form>
        </div>
    );
}
