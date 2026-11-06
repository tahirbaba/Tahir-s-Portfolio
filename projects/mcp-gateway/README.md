# Gatekeeper: secure MCP gateway for AI agents

**Live:** https://gatekeeper-mcp-gateway.vercel.app

Gatekeeper sits between AI agents and company systems (database, files, email, payments). Every tool call goes through authentication, rate limits, per-agent scopes, argument guards, human approval for risky actions, output filtering and an audit log. It speaks the Model Context Protocol (initialize, tools/list, tools/call over HTTP), so any MCP client can connect with a bearer key.

The company (Orbit Telecom), its agents and all data are fictional. Demo keys are public on purpose and only unlock synthetic data.

**Stack:** Python 3 · FastAPI · SQLite authorizer · Anthropic Python SDK (Claude Opus 5.5) · Next.js 16 · TypeScript · Tailwind CSS v4 · Motion · pytest · Vercel

## Security results (no model involved, exact and reproducible)

| | Result |
|---|---|
| Attacks stopped | **40 / 40** |
| Legitimate calls allowed | **9 / 9** |
| Unit tests | **12 / 12** |

Attacks covered: missing and forged keys, scope escalation, argument tampering, destructive SQL, multi-statement SQL, UNION/subquery/CTE/pragma access to a forbidden table, schema reads, ATTACH and extensions, path traversal (including Windows separators), prompt injection inside documents, data exfiltration by email, refunds over limits, PII through aliases, and rate-limit bursts.

Found and fixed while building: PII masking first matched column names, so `SELECT email AS contact` leaked emails. It now masks by value pattern in every cell.

```bash
python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt pytest httpx uvicorn
python evals/security_suite.py   # 49 cases → evals/results/security.json
python -m pytest -q              # 12 tests
python evals/replays.py          # demo replays (scripted agent, real gateway); --live records Claude runs
```

## Try the MCP endpoint

```bash
curl -s https://gatekeeper-mcp-gateway.vercel.app/api/py/mcp \
  -H "Authorization: Bearer sk_demo_analytics" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"db.query","arguments":{"sql":"SELECT * FROM salaries"}}}'
```

## Pages

`/` overview · `/demo` replays, a live playground that calls the real gateway, and a live Claude agent (needs an API key) · `/dashboard` sample traffic and an approval queue · `/case-study` · `/evals` every security case.

## Run locally

```bash
npm install
npm run api   # FastAPI on :8000
npm run dev   # Next.js on :3000
```

---

Built by Muhammad Tahir Hasni, Forward Deployed Engineer and AI Agents Architect.
