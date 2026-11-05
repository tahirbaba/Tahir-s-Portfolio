# Muhammad Tahir Hasni · Portfolio

Personal portfolio of **Muhammad Tahir Hasni**, Agentic AI Developer and AI Agents Architect (Karachi, Pakistan · open to remote).

Design: an animated multi-agent **workflow canvas** hero, a **bento** about grid, agent case studies, process, experience timeline, tech stack, certifications and an in-browser **AI twin** chat.

## Stack
Plain HTML, CSS and JavaScript. No build step, so it deploys as-is to GitHub Pages, Vercel or Netlify.

```
index.html          page content
assets/styles.css   design tokens (dark + light) and layout
assets/main.js      theme toggle, workflow animation, AI twin chat
```

## Run locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Updating content
Every placeholder is marked with an HTML comment `PLACEHOLDER` in `index.html`:
hero numbers, photo, testimonial, projects and links, experience, certifications and contact details.
The AI twin's answers live in the `KB` list in `assets/main.js`.
