import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "../services/auth";
import type { JSX } from "react";

export function RequireAuth({ children }: { children: JSX.Element }) {
    const me = getCurrentUser();
    const loc = useLocation();
    if (!me) return <Navigate to="/login" replace state={{ from: loc }} />;
    return children;
}

export function RequireAdmin({ children }: { children: JSX.Element }) {
    const me = getCurrentUser();
    if (!me) return <Navigate to="/login" replace />;
    if (me.role !== "admin") return <Navigate to="/home" replace />;
    return children;
}

export function LandingRoute() {
    const me = getCurrentUser();
    return <Navigate to={me ? "/home" : "/login"} replace />;
}
