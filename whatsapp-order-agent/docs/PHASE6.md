# Phase 6: Owner ka apna portal

Ab shop owner **khud apne mobile se** menu, prices, timings aur delivery charges badal sakta hai. Har chhoti tabdeeli ke liye aap ko admin panel mein JSON edit nahi karni padegi.

## Link aur setup

1. Vendor file mein `"ownerKeyEnv": "OWNER_KEY_KARACHI_BROAST"` daalein (admin panel se bhi ho sakta hai).
2. `.env` mein ek lambi random key daalein:

   ```
   OWNER_KEY_KARACHI_BROAST=...   # openssl rand -hex 16
   ```

3. Owner ko link dein: `https://<domain>/o/karachi-broast?key=<OWNER_KEY>`

   Ye link sirf owner ke paas rahe. Link kisi aur ke haath lag jaye to key badal dein.

## Owner kya kar sakta hai

| Tab | Kaam |
|---|---|
| **Menu** | Item ka naam, category, price, sizes (Small/Medium/Large) add ya edit; detail; "menu pe dikhao" on/off; item hatana; nayi category |
| **Timing & Delivery** | Har branch ke din aur waqt, koi din band; delivery charges ka tareeqa (free / har order ek jaisa / distance slabs / base + per km); max km; "is se upar free"; minimum order; kitchen ka aam time; pickup on/off; COD aur online payment ki detail; upsell; shop ki baatein (FAQ) |
| **Hisaab** | Aaj aur 7 din ki sale, top item; aap ke pichle 3 mahine ke bills |
| **History** | Har tabdeeli kab hui aur kis ne ki (owner/admin); **Undo** se pichli halat wapas |

**Save** dabate hi bot foran naya menu ya timing use karta hai, restart ki zaroorat nahi. Jin customers ki chat chal rahi thi, unki agli baat nai chat se shuru hoti hai, taake purani price kabhi na aaye.

## Owner kya NAHI badal sakta (sirf aap, admin panel se)
- WhatsApp number ID, tokens aur keys ke naam
- Billing (fees, trial) aur limits
- Branch ka naam, address aur map location
- Order number ka prefix, riders, loyalty, raat ki report

Agar owner in mein se kuch bhejne ki koshish kare, server use nazar-andaz kar deta hai.

## Ghalti se bachao
- Har save se pehle check hota hai. Khaali price, ghalat waqt (jaise 25:00), ya loyalty wala free item hata dena: aise mein save nahi hota aur aasaan zabaan mein bataya jata hai, jaise `"Garlic Bread" price: yahan number likhna zaroori hai`.
- Har save se pehle purani file `vendors/.history/` mein chali jaati hai; har vendor ki aakhri 30 versions rakhi jaati hain.
- **Undo** aakhri tabdeeli wapas karta hai, aur Undo bhi wapas ho sakta hai.
- Admin panel se save karne pe bhi history banti hai.

## Aaj ke liye "khatam" vs menu se hatana
- **Aaj khatam** (kal phir milega): kitchen screen → Menu tab, ya WhatsApp pe `#off zinger`.
- **Hamesha ke liye band ya naya item:** owner portal → Menu.
