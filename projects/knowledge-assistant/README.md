# Compass: company knowledge assistant

**Live:** https://compass-knowledge-assistant.vercel.app

Compass answers employee questions from company documents with a citation for every fact. Access control is applied before ranking, so sections a person may not read never reach the model. Superseded policies are skipped. Every citation in an answer is verified in code against what was retrieved for that user; an answer without a verified source becomes "not found". Questions can be asked in English, Urdu, Roman Urdu or Arabic.

The company (Halcyon Logistics) and all documents are fictional.

**Stack:** Python 3 · FastAPI · BM25 retrieval (no external index) · Anthropic Python SDK (Claude Opus 5.5, tool use) · Next.js 16 · TypeScript · Tailwind CSS v4 · Motion · pytest · Vercel

## Results (no model, exact)

| | Result |
|---|---|
| Recall@1 / Recall@3 / MRR | **100% / 100% / 1.0** on 26 questions |
| Permission leaks | **0** across 10 questions aimed at restricted documents |
| Outdated policy served | **0** |
| Unanswerable questions that still retrieve a loose match | 2 of 4: caught by the citation guard at the answer step |
| Unit tests | **6 / 6** |

Tried and reverted: a term-coverage gate fixed the two loose matches but dropped recall@3 to 84.6%.

## Pages

`/` overview with live replays · `/demo` replays, a live "search as every role" comparison (no AI needed) and live Claude answers · `/dashboard` sample topics, content gaps and permission blocks · `/case-study` · `/evals`

## Run

```bash
python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt pytest httpx uvicorn
python -m pytest -q && python evals/retrieval_suite.py
npm install && npm run api & npm run dev
```

---

Built by Muhammad Tahir Hasni, Forward Deployed Engineer and AI Agents Architect.
