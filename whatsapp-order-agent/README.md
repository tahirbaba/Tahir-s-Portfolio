# WhatsApp Order Agent (multi-vendor)

Restaurants ke liye WhatsApp AI agent. **Ek system, kai vendors.** Har vendor ki ek JSON file hoti hai (menu, branches, delivery charges, timings). Agent usi shop ke hisaab se customers ke sawalon ka jawab deta hai aur order leta hai.

- **WhatsApp:** official Cloud API (legal, ban ka khatra nahi)
- **AI:** Claude Haiku 5.5, low effort, prompt caching (~PKR 1 per conversation)
- **Kitchen / rider:** mobile browser ka ek page. Koi app nahi, koi WhatsApp kharcha nahi
- **Database:** SQLite file (Node 22 mein built-in). Alag database server ki zaroorat nahi

## Ye kaise kaam karta hai

```
Customer ──WhatsApp──► Meta ──webhook──► /webhook
                                            │  number X pe aaya → vendor = jis ka phoneNumberId X hai
                                            ▼
                                     Engine (har chat ki line alag)
                                            │
                          Claude Haiku 5.5 + tools (add_to_cart, set_fulfilment, place_order …)
                                            │  prices, delivery fee, ETA, order # → hamara code
                                            ▼
                                 SQLite: chats, carts, orders
                                            │
                 Kitchen/Rider page (/ops/<vendor>?key=…)  ──►  status badla → customer ko 1 message
```

**Ek order pe customer ko jaane wale messages (kharcha kam rakhne ke liye):**
1. Bot ke jawab, jab tak order final ho
2. Order confirmation: order #, bill, delivery charges, ETA, payment. Ye ek hi message hai.
3. "Rider nikal gaya", saath mein rating ka sawal

Kitchen ka "Accept" aur "Ready" customer ko message **nahi** bhejte. Sirf tab bhejte hain jab zaroori ho, jaise kitchen ne 10+ minute zyada time diya, order reject hua, ya pickup order tayyar ho gaya.

## Folder

| Path | Kya hai |
|---|---|
| `vendors/*.json` | Har vendor ki file. **Naya vendor = nai file** |
| `src/engine.ts` | Message → sahi vendor → sahi chat |
| `src/agent/` | System prompt, tools, Claude loop |
| `src/delivery.ts`, `src/hours.ts`, `src/cart.ts`, `src/orders.ts` | Business logic (AI nahi, code) |
| `src/ops/` | Kitchen/rider screen |
| `src/cli/chat.ts` | Terminal simulator (Meta ke baghair test) |
| `docs/` | Setup guides |

## Pehla test, apne computer pe (sirf Claude key chahiye)

```bash
cd whatsapp-order-agent
```

```bash
npm install
```

```bash
cp .env.example .env
```

`.env` mein `ANTHROPIC_API_KEY=` bharein, phir:

```bash
npm run chat -- demo-pizza
```

Terminal mein customer ban kar likhein: `2 large tikka pizza chahiye`. Location ke liye `/loc 24.925,67.095` likhein. Orders dekhne ke liye `/orders`, order ka status badalne ke liye `/set CC-1001 out_for_delivery`, aur dusri shop ke liye `/vendor demo-fastfood`. Owner commands test karne ke liye `/as 923000000091` likhein (demo-pizza ka owner), phir `#report` ya `#off tikka`. Pre-order ke liye bot se kahein: "kal dopahar 2 baje pickup chahiye".

## Commands

```bash
npm test
```

```bash
npm run vendors:check
```

```bash
npm run dev
```

## Agle steps
1. [docs/SETUP-META.md](docs/SETUP-META.md): Meta app, test number aur webhook
2. [docs/DEPLOY-ORACLE.md](docs/DEPLOY-ORACLE.md): Oracle Cloud free server pe 24/7
3. [docs/ADD-VENDOR.md](docs/ADD-VENDOR.md): naya vendor add karna
4. [docs/PHASE3.md](docs/PHASE3.md): riders, usage meter, owner ki report
5. [docs/PHASE4.md](docs/PHASE4.md): tracking page, loyalty, backup, billing
6. [docs/PHASE5.md](docs/PHASE5.md): **testing ka tareeqa**, go-live checklist, chat viewer
7. [docs/PHASE6.md](docs/PHASE6.md): owner portal (menu/timing khud badalna)

## Phase 2 features

| Feature | Kahan | Kaise |
|---|---|---|
| **Menu web page** | `/m/<vendor>` (public) | Customer items aur size chunta hai, phir "WhatsApp pe bhejein" se order code ke saath WhatsApp pe chala jata hai. Code se cart exact load hota hai, AI ko text parhna nahi parta. Bot "menu" maangne pe khud link bhejta hai. Is ke liye `whatsapp.displayNumber` aur https `PUBLIC_URL` zaroori hain |
| **Owner commands** | Shop ka WhatsApp | `#report`, `#report kal`, `#off zinger`, `#on zinger`, `#pause`, `#resume`, `#status`, `#help`. Sirf `owners` numbers se |
| **Kitchen screen: Menu + Report tabs** | `/ops/<vendor>?key=…` | Item khatam/available, orders band/chalu, aur aaj/kal/7 din ki sale aur top items |
| **Admin panel** | `/admin?key=<ADMIN_KEY>` | Saare vendors, settings check, vendor ki file edit/naya vendor. Save karte hi live, restart nahi |
| **Pre-order** | Chat | "kal 2 baje", "raat 9 baje". Max 20 ghante aage, sirf jab branch us waqt khuli ho. Kitchen screen pe ⏰ nishan |

Sold-out items aur pause ka asar har jagah hota hai: bot unhein add nahi karta, menu page pe "Khatam" dikhta hai, aur order lagne se pehle dobara check hota hai.

## Phase 3 features ([docs/PHASE3.md](docs/PHASE3.md))

| Feature | Kahan | Kaise |
|---|---|---|
| **Rider page** | `/r/<vendor>?key=…` | Rider order uthata hai ("Main le ja raha hoon"), customer ko rider ka naam aur number jata hai, phir delivered + cash mila. Owner ko har rider ka cash aur baqi hisaab |
| **Usage meter** | Admin panel | Har vendor ke mahine ke chats, AI jawab, WhatsApp messages (free/billable), AI tokens, aur andaza kharcha PKR mein, per order bhi. Package pricing isi se |
| **Reorder** | Chat | "pichla order dobara": aaj ki prices ke saath cart, aur khatam items chhod deta hai |
| **Owner ki raat wali report** | WhatsApp template | Tay waqt pe din mein ek dafa: orders, sale, top item. Meta mein utility template banana zaroori hai. Admin panel mein "test bhejo" button |

## Phase 4 features ([docs/PHASE4.md](docs/PHASE4.md))

| Feature | Kahan | Kaise |
|---|---|---|
| **Customer tracking page** | `/t/<code>` (link confirmation aur "rider nikal gaya" messages mein) | Order ke steps, ETA, rider ka naam, call, aur rider kitni door hai (rider page ke GPS se). Extra WhatsApp kharcha nahi. 24 ghante tak |
| **Loyalty** | Vendor file `loyalty` | Har Nth order pe free item khud add, confirmation mein shukriya, bot ko progress maloom |
| **Automatic backup** | Admin → Backups | Roz 05:00 database ki copy, aakhri 14, download aur "abhi lo" button |
| **Billing / invoice** | Admin → Billing | Vendor ka plan, trial (pro-rata), extra orders, aur print/PDF hone wala invoice |

## Phase 5: testing aur launch ke tools ([docs/PHASE5.md](docs/PHASE5.md))

| Feature | Kahan | Kaise |
|---|---|---|
| **AI scenario test** | `npm run scenarios` | 12 asli conversations (Roman Urdu/English) aap ki Claude key se, har ek PASS/FAIL ke saath, aur kharcha bhi |
| **Go-live checklist** | Admin → "Check chalao" | Claude key, Meta token/number, https, keys, backup, webhook: asal mein check |
| **Chat viewer** | Admin → Chats | Har chat ki poori baat-cheet, AI ke tool calls ke saath |
| **Spam/kharche se hifazat** | `.env` + vendor `limits` | Ek customer ke ghante ke max messages; vendor ki rozana AI limit ke baad chats staff ko |

## Phase 6: owner portal ([docs/PHASE6.md](docs/PHASE6.md))

| Feature | Kahan | Kaise |
|---|---|---|
| **Owner portal** | `/o/<vendor>?key=…` | Owner khud mobile se menu, prices, sizes, timings, delivery charges, payment aur FAQ badalta hai. Save karte hi live |
| **Hisaab** | Owner portal | Aaj aur 7 din ki sale, aap ke bills |
| **History + Undo** | Owner portal (admin saves bhi) | Har tabdeeli ka record, aakhri 30 versions, ek click se wapas |
| **Mehfooz fields** | Server | WhatsApp IDs, keys, billing, limits sirf admin badal sakta hai |

## Agle ideas
- Kai vendors ke liye ek hi Meta app (Tech Provider bannay ke baad Embedded Signup)
- Backups ka khud Google Drive pe jana
