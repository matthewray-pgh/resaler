import { useState } from "react";
import { api } from "../hooks/useApi";

export default function Login({ onAuthenticated }) {
  const [step, setStep]       = useState("credentials"); // "credentials" | "2fa"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api.login(email, password);
      if (result.status === "2fa_required") {
        setStep("2fa");
      } else {
        onAuthenticated();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.verify(code);
      onAuthenticated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative w-full max-w-md px-4">
        {/* Logo / header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">Mac.bid Research</span>
          </div>
          <p className="text-slate-500 text-sm">
            {step === "credentials"
              ? "Sign in with your Mac.bid account to start researching deals"
              : "Check your phone — Mac.bid sent you a verification code"}
          </p>
        </div>

        <div className="card p-6">
          {step === "credentials" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="stat-label block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="stat-label block mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  required
                />
              </div>
              {error && (
                <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg px-3 py-2 text-accent-red text-sm">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="stat-label block mb-1.5">SMS Verification Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="123456"
                  className="input font-mono text-center text-xl tracking-widest"
                  maxLength={8}
                  required
                  autoFocus
                />
              </div>
              {error && (
                <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg px-3 py-2 text-accent-red text-sm">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Verifying…" : "Verify code"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("credentials"); setError(null); }}
                className="btn-ghost w-full text-sm text-center"
              >
                ← Back to sign in
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          Your credentials are sent directly to Mac.bid — they are never stored by this app.
        </p>
      </div>
    </div>
  );
}
