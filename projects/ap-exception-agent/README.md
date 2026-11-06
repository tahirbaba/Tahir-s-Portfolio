# Ledger: accounts-payable exception agent

**Live:** https://ledger-ap-agent.vercel.app

Ledger reads supplier invoices (English, Arabic, Urdu or bilingual), extracts the fields with Claude, and runs accounts-payable controls in Python: 3-way match against the purchase order and goods receipt, duplicate detection, bank-detail change (payment-redirection fraud), VAT/GST checks, arithmetic and approval limits. Clean invoices are posted; everything else goes to approval, the exception queue, rejection or a payment hold, with the numbers and a draft message to the vendor.

The company (Crescent Distribution), vendors and invoices are fictional.

**Stack:** Python 3 · FastAPI · Anthropic Python SDK (Claude Opus 5.5, strict tool schemas) · Next.js 16 · TypeScript · Tailwind CSS v4 · Motion · pytest · Vercel

## Results

| | Result |
|---|---|
| Controls suite (no model, exact) | **30 / 30** correct decisions |
| Unit tests | **9 / 9** |
| Reading eval (Claude extraction + decision) | runs with an API key: `python evals/run.py` |

Found while building: the duplicate check missed a re-sent invoice because the posted amount in the ERP data didn't match the document. The controls suite surfaced it.

## Design

- Claude extracts exactly what is printed (mistakes included) through a strict `submit_extraction` tool.
- Python decides, in this order: bank change → duplicate → arithmetic → 3-way match → tax → approval limit.
- `post_to_erp` refuses anything the controls didn't clear; `create_exception` refuses clean invoices.
- No vendor message is drafted for suspected fraud.

## Pages

`/` overview · `/demo` replays of seven invoices, a live controls checker (edit an invoice and rerun, no AI needed) and live Claude reading · `/dashboard` sample month and an exception queue · `/case-study` · `/evals`

## Run

```bash
python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt pytest httpx uvicorn
python -m pytest -q && python evals/controls_suite.py
npm install && npm run api & npm run dev
```

---

Built by Muhammad Tahir Hasni, Forward Deployed Engineer and AI Agents Architect.
