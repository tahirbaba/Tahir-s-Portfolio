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

Terminal mein customer ban kar likhein: `2 large tikka pizza chahiye`. Location ke liye `/loc 24.925,67.095` likhein. Orders dekhne ke liye `/orders`, order ka status badalne ke liye `/set CC-1001 out_for_delivery`, aur dusri shop ke liye `/vendor demo-fastfood`.

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

## Abhi kya nahi hai (Phase 2)
- Menu ka web page (customer link se khud items chune; messages aur bhi kam)
- Owner ki daily WhatsApp report
- Vendor ke liye admin panel (abhi JSON file edit hoti hai)
- Pre-order (kal ke liye order)
