"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // MANDATORY FOR HTTP-ONLY SESSIONS:
        // Instructs the browser to accept and preserve the HttpOnly Set-Cookie header
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 423) {
          setIsLocked(true);
          const retryHeader = response.headers.get("Retry-After");
          if (retryHeader) {
            setRetryAfter(parseInt(retryHeader, 10));
          }
        }
        throw new Error(data.detail || "Authentication credentials rejected.");
      }

      // NO JWT is handled in client-side JavaScript. The session exists safely in the browser cookie jar.
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected security exception occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100 selection:bg-cyan-500 selection:text-black">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 mb-3 tracking-wider uppercase">
            Government Security Tier
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Samundra Drishti</h1>
          <p className="text-sm text-slate-400 mt-1">Classified Maritime Operational Access</p>
        </div>

        {errorMsg && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm border ${
              isLocked
                ? "bg-rose-950/40 border-rose-800/80 text-rose-300"
                : "bg-amber-950/40 border-amber-800/80 text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{isLocked ? "Account Security Lockout (15 min)" : "Authentication Alert"}</span>
            </div>
            <p className="mt-1 text-xs opacity-90">{errorMsg}</p>
            {retryAfter && (
              <p className="mt-2 text-xs font-mono bg-rose-900/40 px-2 py-1 rounded border border-rose-800/60 inline-block">
                Lockout window remaining: ~{Math.ceil(retryAfter / 60)} min
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2">
              Official Identity / Email
            </label>
            <input
              type="email"
              required
              disabled={loading || isLocked}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="officer@maritime.gov.in"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2">
              Password Credential
            </label>
            <input
              type="password"
              required
              disabled={loading || isLocked}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full py-3.5 px-4 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-semibold rounded-xl shadow-lg shadow-cyan-950/50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading
              ? "Verifying Cryptographic Identity..."
              : isLocked
              ? "Access Temporarily Suspended"
              : "Authenticate & Enter Grid"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500 space-y-1">
          <p>Protected by automated 5-strike brute-force defense.</p>
          <p className="text-slate-600">Zero-Trust: Session stored exclusively in strict HTTP-only cookies.</p>
        </div>
      </div>
    </div>
  );
}
