# Phase 3: Riders, usage meter, reorder, owner ki raat wali report

## 1. Rider page

Har vendor ke riders ka ek shared link hota hai. Rider apna naam chunta hai aur phir:
1. **Tayyar orders** dekhta hai: kahan se uthana hai, kise dena hai, aur kitna cash lena hai.
2. **"Main le ja raha hoon"** dabata hai. Customer ko **ek** message jata hai jis mein rider ka naam aur number hota hai, aur order rider ki list mein aa jata hai. Do riders ek hi order nahi le sakte.
3. Delivery pe Map aur Call ke buttons istemal karta hai, phir **"cash mil gaya"** tick karta hai aur **"Deliver ho gaya"** dabata hai. Is pe customer ko koi message nahi jata.

Owner ko Report tab aur `#report` mein dikhta hai ke har rider ne kitni delivery ki, kitna cash diya, aur kitna **baqi** hai.

**Setup** (vendor file):

```json
"riders": [
  { "name": "Imran", "phone": "923001112233" },
  { "name": "Bilal", "phone": "923004445566" }
],
"riderKeyEnv": "RIDER_KEY_KARACHI_BROAST"
```

`.env` mein key daalein:

```
RIDER_KEY_KARACHI_BROAST=...   # openssl rand -hex 16
```

Riders ko link dein: `https://<domain>/r/karachi-broast?key=<RIDER_KEY>`

> Ye link shop ke saare riders ka ek hi hai. Koi rider kaam chhod de to key badal dein aur baqi riders ko naya link de dein.

Kitchen screen pe bhi "Rider nikal gaya" ke saath riders ka dropdown aata hai. Rider ke paas smartphone na ho to kitchen se hi rider chun lein.

## 2. Usage aur kharcha (admin panel ke upar)

Har vendor ka mahine ka hisaab:

| Column | Matlab |
|---|---|
| Chats | nayi conversations |
| AI jawab | AI ne kitne messages ka jawab diya |
| Orders / Sale | orders aur sale |
| WA msgs (free) | hum ne kitne WhatsApp messages bheje; bracket mein Meta ke free wale (har number ke 1,000 mahana) |
| Meta / AI | andaza kharcha PKR mein |
| Per order | ek order pe asal kharcha |

**Isi se package ki pricing tay karein:** vendor ka asal kharcha + aap ka munafa. Rates `.env` mein `RATE_…` se badal sakte hain, jaise dollar rate ya Meta ka rate. Ye andaza hai; asal bill Meta (WhatsApp Manager) aur Anthropic Console mein dekhein.

## 3. "Pichla order dobara"

Customer kahe "wahi jo pichli dafa mangwaya tha", to bot pichla order cart mein daal deta hai, **aaj ki prices** ke saath. Jo item ab khatam hai ya menu se hat gaya, us ka bot customer ko bata deta hai. Phir normal tareeqe se confirm hota hai.

## 4. Owner ko raat ko khud report (WhatsApp template)

WhatsApp ke rule ke mutabiq, agar owner ne 24 ghante se shop ke number pe message nahi kiya to bot usay normal message nahi bhej sakta. Is ke liye Meta se approved **template** chahiye.

### Template banana (ek dafa, har vendor ke WhatsApp account mein)
1. **WhatsApp Manager → Message templates → Create template**
2. Category: **Utility**. Name: `daily_sales_report`. Language: **English**.
3. Body (5 variables, isi tarteeb mein):

   ```
   Daily summary for {{1}} ({{2}}): {{3}} orders, total sale {{4}}. Top item: {{5}}. Reply #report for details.
   ```

4. Examples mein kuch bhi likh dein, jaise `Zing Bites`, `Wed 11 Nov`, `42`, `PKR 78,500`, `Zinger Burger x18`.
5. Submit karein. Approval mein aam tor pe kuch minute se kuch ghante lagte hain.

### Vendor file

```json
"owners": ["923001234567"],
"dailyReport": { "enabled": true, "time": "23:45", "template": "daily_sales_report", "language": "en" }
```

- `time` Pakistan ka waqt hai. Agar ye 06:00 se pehle ho (jaise dukaan raat 2 baje band hoti hai aur `02:30` rakha), to report **pichle din** ki hogi.
- Report din mein sirf ek dafa jati hai. Server us waqt band tha to 6 ghante ke andar chalu hone pe chali jayegi.
- **Test:** admin panel mein vendor chunein aur **"Owner report test bhejo"** dabayein. Error aaye to template ka naam, language ya approval check karein.

**Kharcha:** har report ek utility template message hai, yani ~PKR 4 per owner per din, aur usage meter mein gina jata hai. Template na banana ho to owner khud `#report` bhej kar report le sakta hai, jo free window ke andar hai.
