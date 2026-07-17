# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Yes    |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Email: harshal.paltse@example.com  
Subject: `[SECURITY] ML Monitoring System — <brief description>`

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

You will receive a response within **48 hours**. Once confirmed, a fix will be released within **7 days** for critical issues.

## Security Best Practices

When deploying this system:

1. **Change `SECRET_KEY`** — generate with `python -c "import secrets; print(secrets.token_hex(32))"`
2. **Use PostgreSQL** in production — not SQLite
3. **Set `APP_ENV=production`** — disables auto-reload and debug mode
4. **Restrict CORS origins** — set `CORS_ORIGINS` to your exact frontend domain
5. **Rotate API keys** regularly via the Settings page
6. **Never commit `.env`** — use `.env.example` as a template only
7. **Never commit `config/settings.env`** — it is gitignored; use `config/settings.env.example`
8. **Firebase credentials** — stored in environment variables only, never hardcoded
9. **Do not commit `.vscode/`** — IDE config is gitignored; each developer manages their own
10. **Audit dependencies regularly** — run `pip-audit -r backend/requirements.txt`
