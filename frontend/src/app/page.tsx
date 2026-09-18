export default function Home() {
  return (
    <main style={{ padding: "3rem 2rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
      <header style={{ marginBottom: "2.5rem", borderBottom: "1px solid var(--surface-border)", paddingBottom: "1.5rem" }}>
        <div style={{ display: "inline-block", background: "rgba(0, 229, 255, 0.1)", border: "1px solid var(--accent)", color: "var(--accent)", padding: "4px 12px", borderRadius: "9999px", fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          Government Maritime Surveillance Grid
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          SAMUNDRA DRISHTI <span style={{ color: "var(--primary)" }}>CORE</span>
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
          High-Security Real-Time Coastal Intelligence & Vessel Traffic Telemetry
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", borderRadius: "12px", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem", color: "#60a5fa" }}>Database Layer</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Connected through <strong>PgBouncer Transaction Pooling</strong> on port <code>6432</code> with <code>NullPool</code> and zero statement caching (<code>statement_cache_size=0</code>).
          </p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", borderRadius: "12px", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem", color: "#34d399" }}>Security Architecture</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Anti-enumeration UUIDv4 primary keys, OWASP-compliant brute-force protection with failed attempt tracking, and automated account lockout windows.
          </p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", borderRadius: "12px", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem", color: "#f59e0b" }}>Backend Engine</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Asynchronous Python FastAPI engine powered by <code>asyncpg</code> and SQLAlchemy 2.0 with health liveness and readiness probes.
          </p>
        </div>
      </div>
    </main>
  );
}
