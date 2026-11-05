# Leadline: speed-to-lead agent

**Live:** https://leadline-speed-to-lead.vercel.app

Leadline replies to inbound leads from a website form, WhatsApp and missed calls within seconds. It scores each lead against the ideal customer profile in code, routes it to the right rep, alerts reps about hot leads, offers meeting slots in the lead's time zone, books meetings safely and writes everything to the CRM. It replies in English, Arabic, Urdu or Roman Urdu.

The selling company (Northstar Analytics), its reps and all leads are fictional.

**Stack:** Python 3 · FastAPI · Anthropic Python SDK (Claude Opus 5.5, tool use) · Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Motion · pytest · Vercel (Python functions + Next.js)

## Pages

| Page | For | What it shows |
|---|---|---|
| `/` | Sales leaders | Problem, how it works, features |
| `/demo` | Everyone | The lead's inbox or WhatsApp next to every score, rule and booking check. Auto-play replays and a live lead form |
| `/dashboard` | Sales managers | Funnel, sources, lead quality, hot-lead alerts and rep load (clearly labelled sample data) |
| `/case-study` | Recruiters, CTOs | Architecture, key decisions, tests, rollout plan |
| `/evals` | Engineers | pytest results and the 48-lead agent eval suite |

## How it works

```
Lead (form / WhatsApp / missed call)
  → FastAPI  (Pydantic validation, signed session state, rate limit)
  → Claude agent loop (tool use, prompt caching, refusal fallback)
      tools: score_lead · enrich_company · get_availability · book_meeting · log_to_crm · alert_rep
  → Python rules decide: ICP score + reasons, tier policy, region routing,
    zoneinfo scheduler (rep hours, weekends, conflicts, midnight), spam/competitor filter
```

Rules the model cannot bypass: meetings only for hot and warm leads, alerts only for hot leads (once), no double booking, no booking outside the rep's working hours, no reply to spam.

## Tests and evals

```bash
python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt pytest httpx
python -m pytest -q              # 26 tests, no model calls
python evals/rules_report.py     # writes evals/results/rules.json
python evals/build_dataset.py    # 48 leads, 4 languages
ANTHROPIC_API_KEY=... python evals/run.py      # agent eval + LLM judge
ANTHROPIC_API_KEY=... python evals/replays.py --live   # record real demo replays
```

The test suite caught a real bug during development: a slot at 23:30 passed the working-hours check because the end time wrapped past midnight.

## Run locally

```bash
npm install
npm run api      # FastAPI on :8000
npm run dev      # Next.js on :3000 (proxies /api/py to :8000)
```

Environment: `ANTHROPIC_API_KEY`, `STATE_SECRET`. Without a key the site works and the live form reports that the agent is offline.

---

Built by Muhammad Tahir Hasni, Forward Deployed Engineer and AI Agents Architect.
