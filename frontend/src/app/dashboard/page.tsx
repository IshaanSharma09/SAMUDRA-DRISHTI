"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/auth/me", {
      credentials: "include", // Transmits HTTP-only cookie automatically
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch("http://localhost:8000/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Validating secure session credentials...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold">Maritime Operational Grid</h1>
            <p className="text-xs text-slate-400">Authenticated Identity: {user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition-colors"
          >
            Terminate Session
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Role Clearance</span>
            <p className="text-lg font-bold text-cyan-400 mt-1 uppercase">{user?.role}</p>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Identity UUID</span>
            <p className="text-xs font-mono text-slate-300 mt-2 truncate">{user?.id}</p>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Session Security</span>
            <p className="text-xs text-emerald-400 mt-2 font-semibold">Strict HTTP-Only Cookie Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
