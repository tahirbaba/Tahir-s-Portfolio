# Verity: recruiter integrity copilot

**Live:** https://verity-recruiter-copilot.vercel.app

Verity helps recruiters screen a flood of applications faster and more fairly. It removes names, contact details, gender, age and marital status before Claude reads a CV; counts a rubric point only when its evidence quote appears verbatim in the CV; computes experience from dates; and checks the CV against the application form and public profile for inflated years, title inflation, overlapping full-time roles, degree-year and certificate-ID problems. The output is an explained recommendation and a verification checklist. Nothing is auto-rejected, and career gaps are never penalised.

The company (Meridian Health) and all candidates are fictional.

**Stack:** Python 3 · FastAPI · Anthropic Python SDK (Claude Opus 5.5, strict tool schemas) · Next.js 16 · TypeScript · Tailwind CSS v4 · Motion · pytest · Vercel

## Results (no model, exact)

| | Result |
|---|---|
| Integrity and fairness suite | **30 / 30** |
| — counterfactual fairness (name, gender, age, marital status swaps) | identical redacted text and identical scores |
| — evidence grounding | invented quotes earn nothing and are listed |
| Unit tests | **8 / 8** |

Deliberately not built: an "AI-written CV" detector. They are unreliable and penalise strong writers and non-native speakers.

## Pages

`/` overview · `/demo` replays with an original/redacted toggle, a live consistency checker (no AI needed) and live Claude screening · `/dashboard` sample pipeline plus a real fairness panel · `/case-study` · `/evals`

## Run

```bash
python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt pytest httpx uvicorn
python -m pytest -q && python evals/integrity_suite.py
npm install && npm run api & npm run dev
```

---

Built by Muhammad Tahir Hasni, Forward Deployed Engineer and AI Agents Architect.
