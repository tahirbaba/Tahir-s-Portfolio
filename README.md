# Muhammad Tahir Hasni · Forward Deployed Engineer

Portfolio of **Muhammad Tahir Hasni**, Forward Deployed Engineer and AI Agents Architect (Karachi, Pakistan · open to remote).

## Highlights
- **3D deployment globe**: a real dot-matrix world map (Three.js / React Three Fiber) with live arcs from Karachi to deployment sites. Drag to rotate.
- **Live Lab**: visitors describe a business workflow and three Claude agents (Discovery → Architect → Rollout) design a forward deployment for it, streamed live over SSE with structured outputs.
- **AI twin**: a streaming Claude chat grounded only in this portfolio's content.
- **Field deployments**: case studies written as deployment reports.
- **⌘K command menu**, smooth scrolling, scroll-in motion, and reduced-motion support.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Motion · React Three Fiber / Three.js · Lenis · Anthropic TypeScript SDK

## Run locally
```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm run dev
```
Without `ANTHROPIC_API_KEY` the Live Lab and AI twin run in **demo mode** with offline answers, so the site always works.

## Deploy (Vercel)
1. Import the repository in Vercel.
2. Add the environment variable `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`, default `claude-opus-5-5`).
3. Deploy.

The API routes include input limits and a per-IP rate limit (chat: 20 per 10 min, lab: 4 per 30 min). The limiter is per server instance; use a shared store such as Upstash Redis for strict limits.
Set a monthly spend limit on your Anthropic account.

## Editing content
All content lives in `src/content/profile.ts`. The UI and the AI twin both read from it. Sample content is marked `PLACEHOLDER` or `placeholder: true`.

- Photo, links, email: `profile`
- Numbers: `metrics`
- Projects: `deployments`
- Experience and certifications: `experience`, `certifications`
- Globe cities: `home`, `sites`

`npm run globe:data` regenerates `public/land-dots.json` from Natural Earth data.
