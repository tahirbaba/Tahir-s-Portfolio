# Naya vendor add karna (30–60 minute)

Code ko haath nahi lagana. Bas ek file aur do settings.

## 1. File banayein
`vendors/demo-pizza.json` copy kar ke naya naam dein, jaise `vendors/karachi-broast.json`. Phir badlein:

| Field | Kya likhna hai |
|---|---|
| `slug` | chhote harf, jaise `karachi-broast`. Kitchen link mein yahi aata hai |
| `name` | Shop ka naam, jo customer dekhega |
| `orderPrefix` | 2–4 bade harf, jaise `KB`, to orders `KB-1001` ban jayenge |
| `whatsapp.phoneNumberId` | Meta se mila Phone number ID |
| `whatsapp.accessTokenEnv` | `.env` mein token ka naam, jaise `WA_TOKEN_KARACHI_BROAST` |
| `opsKeyEnv` | kitchen screen key ka naam, jaise `OPS_KEY_KARACHI_BROAST` |
| `branches` | har branch: naam, address, **lat/lng** (Google Maps pe right-click karne se milta hai), timings, delivery rules, prep time |
| `menu` | har item ka `id` (chhote harf), naam, category, aur `price` **ya** `variants` (sizes) |
| `payment` | `cod: true/false`, aur `online` mein Raast/JazzCash/Easypaisa ki detail (agar leta ho) |
| `faq` | Shop ki baqi baatein: halal, parking, extra cheese ka rate wagera |
| `style` | Bot ka andaz |
| `upsell` | Ek line jo bot order ke saath offer kare (optional) |

### Timings
`"fri": { "open": "14:00", "close": "03:00" }`. Agar close ka waqt open se pehle ho, to matlab dukaan raat 12 ke baad band hoti hai. Kisi din band ho to `"mon": null` likhein.

### Delivery charges (har branch ki apni)

Free delivery:

```json
"rule": { "type": "free" }
```

Har order pe ek jaisa charge:

```json
"rule": { "type": "flat", "fee": 100 }
```

Distance ke hisaab se slabs:

```json
"rule": { "type": "slabs", "slabs": [ { "upToKm": 3, "fee": 100 }, { "upToKm": 6, "fee": 150 } ] }
```

Base + per km:

```json
"rule": { "type": "per_km", "baseFee": 80, "perKm": 25, "includedKm": 2 }
```

Saath mein ye bhi set karein:
- `maxKm`: is se door delivery nahi
- `freeAbove`: is amount se upar delivery free (optional)
- `minOrder`: delivery ke liye kam se kam bill

## 2. Check karein

```bash
npm run vendors:check
```

## 3. Settings
`.env` mein add karein:

```
WA_TOKEN_KARACHI_BROAST=...
OPS_KEY_KARACHI_BROAST=...   # openssl rand -hex 16
```

Agar vendor ki Meta app alag hai, to us ka App Secret bhi `META_APP_SECRET` mein comma laga kar add karein.

## 4. Restart

```bash
docker compose restart app
```

## 5. Test
- Apne phone se vendor ke number pe "menu" bhejein.
- Kitchen link `https://<domain>/ops/karachi-broast?key=<OPS_KEY>` kitchen ke mobile pe kholein aur **Sound on** dabayein.

## Menu ya price badalna
JSON file edit karein, phir `docker compose restart app`. Jin customers ki chat chal rahi thi, unki agli baat nai chat se shuru hogi, taake purani prices kabhi na aayein.
