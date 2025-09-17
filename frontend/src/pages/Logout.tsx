// src/pages/Logout.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth";

export default function Logout() {
    const navigate = useNavigate();
    useEffect(() => {
        logout().finally(() => navigate("/login", { replace: true }));
    }, [navigate]);
    return <div className="p-6 text-sm text-gray-600">Signing out…</div>;
}