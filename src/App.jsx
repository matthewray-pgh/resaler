import { useState, useEffect } from "react";
import { api } from "./hooks/useApi";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [authState, setAuthState] = useState("checking"); // "checking" | "authenticated" | "unauthenticated"

  useEffect(() => {
    api.checkStatus()
      .then(res => setAuthState(res.isAuthenticated ? "authenticated" : "unauthenticated"))
      .catch(() => setAuthState("unauthenticated"));
  }, []);

  function handleLogout() {
    api.logout().finally(() => setAuthState("unauthenticated"));
  }

  if (authState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <Login onAuthenticated={() => setAuthState("authenticated")} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}
