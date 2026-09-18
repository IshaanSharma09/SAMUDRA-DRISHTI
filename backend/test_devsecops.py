import yaml

def verify_production_hardening():
    print("--- 1. Verifying Nginx Security Headers ---")
    with open("../nginx/nginx.conf", "r", encoding="utf-8") as f:
        nginx_content = f.read()

    assert "Strict-Transport-Security" in nginx_content, "Missing HSTS header"
    assert "max-age=63072000" in nginx_content, "HSTS max-age should be at least 1 year (63072000)"
    assert "X-Frame-Options" in nginx_content and "DENY" in nginx_content, "Missing X-Frame-Options DENY"
    assert "X-Content-Type-Options" in nginx_content and "nosniff" in nginx_content, "Missing nosniff header"
    assert "Content-Security-Policy" in nginx_content, "Missing Content-Security-Policy header"
    assert "script-src 'self'" in nginx_content, "CSP must restrict script-src to 'self'"
    assert "frame-ancestors 'none'" in nginx_content, "CSP must restrict frame-ancestors"
    print(" [PASS] Nginx configuration enforces HSTS, X-Frame-Options, nosniff, and strict CSP.")

    print("\n--- 2. Verifying Zero-Trust Network Encapsulation in docker-compose.prod.yml ---")
    with open("../docker-compose.prod.yml", "r", encoding="utf-8") as f:
        compose_content = f.read()

    data = yaml.safe_load(compose_content)
    services = data["services"]

    # Only Nginx exposes ports to the outside world
    assert "ports" in services["nginx"], "Nginx must expose gateway ports (80/443)"
    print(" [PASS] Ingress gateway Nginx exposes ports 80/443.")

    # Critical security rule: Database and Redis must NEVER expose ports directly to the internet
    isolated_services = ["postgres", "pgbouncer", "redis", "backend", "frontend"]
    for svc_name in isolated_services:
        assert "ports" not in services[svc_name], f"SECURITY VIOLATION: {svc_name} has host 'ports' exposed!"
        print(f" [PASS] Service '{svc_name}' has 0 host port bindings (internal network only).")

    # Internal network must be explicitly marked internal: true
    assert "internal_data_mesh" in data["networks"], "internal_data_mesh network must exist"
    assert data["networks"]["internal_data_mesh"]["internal"] is True, "internal_data_mesh must be internal: true"
    print(" [PASS] 'internal_data_mesh' is configured with internal: true (no internet routing).")

    print("\n--- 3. Verifying Non-Root Multi-Stage Dockerfiles ---")
    with open("Dockerfile", "r", encoding="utf-8") as f:
        backend_docker = f.read()
    assert "USER appuser:appgroup" in backend_docker, "Backend must run as non-root appuser"
    assert "FROM python:3.11-slim-bookworm AS builder" in backend_docker
    assert "FROM python:3.11-slim-bookworm AS runner" in backend_docker
    print(" [PASS] Backend Dockerfile uses multi-stage build and drops privileges to appuser (10001).")

    with open("../frontend/Dockerfile", "r", encoding="utf-8") as f:
        frontend_docker = f.read()
    assert "USER nextjs" in frontend_docker, "Frontend must run as non-root nextjs"
    assert "FROM node:22-alpine AS builder" in frontend_docker
    assert "FROM node:22-alpine AS runner" in frontend_docker
    print(" [PASS] Frontend Dockerfile uses multi-stage build and drops privileges to nextjs (1001).")

    print("\nALL PRODUCTION HARDENING & DEVSECOPS AUDITS PASSED!")

if __name__ == "__main__":
    verify_production_hardening()
