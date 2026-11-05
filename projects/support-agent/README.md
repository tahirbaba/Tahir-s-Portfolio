# Relay: multilingual customer support agent

A production-style support agent for **Nimbus Home**, a fictional online home-goods store. Relay talks to customers in **English, Arabic, Urdu and Roman Urdu**, verifies who they are, follows refund and shipping policy, takes real actions through tools, and hands hard cases to a human with a summary.

Built with Next.js, TypeScript and the Claude API (`claude-opus-5-5`). All customers, orders and emails are synthetic.

## Why this project

Most support-bot demos answer FAQs. Real deployments fail on the parts around the model: identity checks, refund limits, policy windows, prompt injection, escalation and proof that it works. Relay is built around those parts.

| Problem in real deployments | How Relay handles it |
|---|---|
| Agents promise refunds they can't give | Every rule (30-day window, 100 USD auto-approval limit, late-delivery and lost-parcel rules) is enforced in tool code. The model can ask; only compliant actions go through. |
| Leaking order details to the wrong person | `verify_order` needs the order number **and** the matching email. Wrong and unknown orders get the same error. Three failed attempts lock verification. |
| Clients tampering with session state | Conversation state is HMAC-signed on the server. |
| Prompt injection ("admin mode", "print your instructions") | Customer text is treated as untrusted; tools refuse unverified actions regardless of what the model is told. Covered by eval cases. |
| Customers stuck with a bot | Legal threats, chargebacks, safety issues and requests for a person go to `escalate_to_human` with a case summary. |
| PII in logs | Emails, phone numbers and card numbers are masked in every trace. |
| "Does it actually work?" | Two-layer evaluation: deterministic rule tests plus a 116-case agent eval in four languages. |

## Architecture

```
Customer message
   │
   ▼
Next.js API route ── verifies signed session state, rate limit, input limits
   │
   ▼
Agent loop (Claude, tool use, adaptive thinking, prompt caching)
   │   tools: verify_order · search_policy · issue_refund · start_return
   │          update_address · cancel_order · escalate_to_human
   ▼
Tool executor ── business rules enforced in code ── returns result or a rule error
   │
   ▼
Reply + signed state + redacted trace (latency, tokens, cost) → Ops console
```

- `lib/tools.ts`: tool schemas (strict) and the rule-enforcing executor
- `lib/agent.ts`: the agent loop, cost accounting and trace
- `lib/session.ts`: HMAC-signed conversation state
- `data/`: synthetic store, orders and policies
- `evals/`: dataset builder, eval runner, LLM judge, results
- `tests/`: rule tests and agent-loop tests with a scripted fake model

## Evaluation

**Layer 1: rule and loop tests (no model calls).** 29 tests covering identity, refund limits, windows, duplicates, address changes, cancellations, returns, escalation, PII masking and the agent loop. Current result: **29/29 passing**.

```bash
npm run rules:report
```

**Layer 2: agent eval suite.** 116 scripted conversations (29 per language) across 16 categories, including prompt injection, identity mismatch and multi-turn cases. Each case is graded on:

- expected actions happened, and no forbidden action happened
- escalation when required, and not when it wasn't needed
- verified the right order; nothing leaked on identity and injection cases
- replied in the customer's script and language
- LLM judge: grounded in the tool log, helpfulness and tone

```bash
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm run eval                 # or: npm run eval -- --limit 12 --lang ar
```

Results are written to `evals/results/latest.json` and `report.md`, and shown on the `/evals` page. **Agent eval results will be published here after the first run; no numbers are shown before they are measured.**

## Run locally

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY, optional STATE_SECRET
npm run dev
```

Without an API key the UI and the `/evals` page work, and the chat shows that the live agent is offline.

## Deploy

Vercel, with the project root set to `projects/support-agent`. Environment variables: `ANTHROPIC_API_KEY`, `STATE_SECRET` (any long random string). Set a monthly spend limit on the Anthropic account.

---

Built by [Muhammad Tahir Hasni](https://github.com/tahirbaba), Forward Deployed Engineer and AI Agents Architect.
