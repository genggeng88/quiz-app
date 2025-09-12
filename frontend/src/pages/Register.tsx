// src/pages/Register.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/auth";

export default function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [pwd, setPwd] = useState("");
    const [confirm, setConfirm] = useState("");
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
        if (pwd.length < 6) {
            setErr("Password must be at least 6 characters.");
            return;
        }
        if (pwd !== confirm) {
            setErr("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);
            // register returns { ok: true, message: string } and DOES NOT log in
            const res = await register({
                email,
                password: pwd,
                firstName,
                lastName,
                isActive: true,   // sent as "True"
                isAdmin: false,   // sent as "False"
            });

            // Redirect to /login; pass a flash message
            navigate("/login", {
                replace: true,
                state: { flash: res.message || "Registered successfully. Please log in." },
            });
        } catch (e: any) {
            setErr(e?.message ?? "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-2xl p-6 shadow">
                <h1 className="text-2xl font-semibold mb-4">Create account</h1>

                {err && (
                    <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700 border border-red-200">
                        {err}
                    </div>
                )}

                <label className="block mb-2 text-sm font-medium">First name</label>
                <input
                    className="w-full rounded-md border p-2 mb-4"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                />

                <label className="block mb-2 text-sm font-medium">Last name</label>
                <input
                    className="w-full rounded-md border p-2 mb-4"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                />

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
                        placeholder="Minimum 6 characters"
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        autoComplete="new-password"
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

                <label className="block mb-2 text-sm font-medium">Confirm password</label>
                <input
                    type={showPwd ? "text" : "password"}
                    className="w-full rounded-md border p-2 mb-4"
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md bg-black text-white py-2 disabled:opacity-60"
                >
                    {loading ? "Creating account..." : "Register"}
                </button>

                <p className="text-sm mt-4">
                    Already have an account?{" "}
                    <Link to="/login" className="underline">Log in</Link>
                </p>
            </form>
        </div>
    );
}