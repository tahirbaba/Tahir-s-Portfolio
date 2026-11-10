# Phase 4: Tracking, loyalty, backups, billing

## 1. Customer ke liye live tracking page

Har order ka ek secret link banta hai: `https://<domain>/t/<code>`. Ye link:
- **Order confirmation** wale message mein, aur
- **"Rider nikal gaya"** wale message mein jata hai.

Ye pehle se jaane wale messages hain, is liye tracking ka **koi extra WhatsApp kharcha nahi**.

Page pe kya dikhta hai:
- Andazan waqt, ya pre-order ka din aur waqt
- Order ke steps: mil gaya → kitchen → tayyar → rider raste mein → deliver
- Rider raste mein ho to: rider ka naam, **kitni door hai (km aur minute)**, call ka button, aur map
- Items aur total

**Rider ki location kahan se aati hai?** Jab rider ke paas koi order "raste mein" ho, to rider page phone ka GPS share karta hai, har ~25 second baad. Rider ke phone pe pehli dafa location ki ijazat (Allow) deni hogi. GPS 5 minute se purana ho to page distance nahi dikhata, sirf "rider raste mein hai".

**Shart:** link sirf tab bhejte hain jab `PUBLIC_URL` **https** ho. Link 24 ghante baad band ho jata hai, aur search engines pe nahi aata.

## 2. Loyalty: har 10th order pe free item

Vendor file mein:

```json
"loyalty": { "enabled": true, "every": 10, "rewardItemId": "drink-345" }
```

- Customer ke har 10th order pe ye item **khud** order mein add ho jata hai, PKR 0 mein. Reject hue orders nahi gine jaate.
- Confirmation mein "🎁 Shukriya! Ye aap ka 10th order hai…" aata hai. Kitchen screen pe bhi `🎁 FREE …` dikhta hai.
- Bot ko pata hota hai ke customer ke kitne orders reh gaye, aur wo poochne pe bata deta hai.
- `rewardItemId` menu ka asal item id hona chahiye, warna "Check karo" error deta hai.

## 3. Automatic backup

- Roz **05:00** (Pakistan time) poore database ki ek copy `data/backups/` mein banti hai, aur aakhri **14** rakhi jaati hain.
- Admin panel → **Backups**: list, download (⬇), aur **"Backup abhi lo"**.
- Settings (`.env`): `BACKUP_TIME`, `BACKUP_KEEP`, `BACKUP_DIR`.

**Server se bahar bhi copy rakhein.** Server kharab ho to us ke andar ke backups bhi chale jayenge. Hafte mein ek dafa admin se download kar ke Google Drive mein rakh lein.

**Restore (wapas lana):**

```bash
docker compose stop app
```

```bash
cp data/backups/agent-2026-11-20-0500.db data/agent.db
```

```bash
docker compose start app
```

## 4. Billing: aap ki fees aur invoice

Har vendor ki file mein us ka plan:

```json
"billing": { "plan": "Standard", "monthlyFee": 7000, "includedOrders": 3000, "extraPerOrder": 3, "trialUntil": "2026-11-14" }
```

| Field | Matlab |
|---|---|
| `plan` | invoice pe naam |
| `monthlyFee` | mahana fee (PKR) |
| `includedOrders` | is fee mein kitne orders; `0` = unlimited |
| `extraPerOrder` | is se zyada har order ka charge |
| `trialUntil` | free trial ki aakhri tareekh (optional) |

**Hisaab kaise hota hai:**
- Trial ke din free hain. Mahine ke beech trial khatam ho to fee **sirf baqi dinon ki** lagti hai (pro-rata).
- Trial ke dauran aaye orders bill mein nahi gine jaate.
- Meta (WhatsApp) ka bill vendor ko Meta khud bhejta hai; wo is invoice mein nahi hai.

**Admin panel → Billing** mein har vendor ka mahine ka bill hai. Trial khatam hone mein 3 din ya kam reh jayein to laal nishan aata hai. **Invoice** link pe "Print / Save as PDF" se PDF bana kar vendor ko WhatsApp kar dein.

Invoice pe aap ka naam aur number `.env` se aata hai:

```
BUSINESS_NAME=Tahir AI Solutions
BUSINESS_CONTACT=WhatsApp +92 300 1234567
```
