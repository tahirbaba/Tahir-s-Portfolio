# Meta (WhatsApp Cloud API) setup

Meta ke screens aksar badalte rehte hain. Agar koi button naam se na mile, to usi section mein dhoondein.

## A. Demo ke liye (aap ka apna account, free)

1. **developers.facebook.com** pe apne Facebook account se login karein. Phir **My Apps → Create App**.
2. Use case mein **"Connect with customers through WhatsApp"** chunein. Business portfolio maange to naya bana lein (free).
3. App ke andar **WhatsApp → API Setup** kholein:
   - Meta aap ko ek **free test number** deta hai.
   - **Phone number ID** copy karein, aur `vendors/demo-pizza.json` mein `whatsapp.phoneNumberId` pe paste karein.
   - **"To"** list mein apna aur vendor ka number add karein. Test number sirf in 5 numbers ko jawab de sakta hai.
   - **Temporary access token** copy kar ke `.env` mein `WA_TOKEN_DEMO_PIZZA=` mein daalein. Ye token 24 ghante chalta hai, demo ke liye kaafi hai.
4. **App settings → Basic → App secret** copy kar ke `.env` mein `META_APP_SECRET=` mein daalein.
5. `.env` mein `WHATSAPP_VERIFY_TOKEN=` ke saamne koi bhi lambi random line likhein.
6. Server chalayein (Oracle guide dekhein, ya local test ke liye neeche "Local tunnel" wala hissa).
7. **WhatsApp → Configuration → Webhook → Edit:**
   - Callback URL: `https://<aap-ka-domain>/webhook`
   - Verify token: wahi jo `.env` mein likha
   - Save karein. Phir **Webhook fields** mein **messages** ko **Subscribe** karein.
8. Apne phone se test number pe "salam" bhejein. Bot jawab dega ✅

### Local tunnel (apne PC pe test, server ke baghair)
Meta ko public **https** address chahiye hota hai. Testing ke liye Cloudflare ka free quick tunnel use kar sakte hain:

```bash
npm run dev
```

Dusre terminal mein:

```bash
cloudflared tunnel --url http://localhost:3000
```

Jo `https://….trycloudflare.com` address mile, wahi Meta mein callback URL bana dein. Ye address har dafa badal jata hai, is liye sirf testing ke liye hai.

## B. Asal vendor (vendor ka apna number)

**Asool:** WhatsApp ka account aur bill **vendor ke naam** pe hoga. Aap sirf technical admin hain. Is ke liye aap ki apni company registration ki zaroorat nahi.

1. Vendor ke saath bait kar **business.facebook.com** pe **vendor ka Business portfolio** banayein (free). Business ka naam aur shop ka address daalein.
2. Vendor aap ko **Settings → People** mein **admin** add kare.
3. Isi portfolio mein **developers.facebook.com** se nai app banayein (A ke steps 1–2). Har vendor ki app alag ho sakti hai, server sab ke App Secrets le leta hai:
   `META_APP_SECRET=secret_vendor1,secret_vendor2`
4. **WhatsApp → API Setup → Add phone number:** vendor ka number add karein aur OTP vendor ke phone pe aayega.
   - ⚠️ **Purana number:** agar number abhi WhatsApp Business App pe chal raha hai, to Meta ka **coexistence** option (App + API saath saath) dekhein. Ye option Meta zyada tar "Embedded Signup" flow mein deta hai, jo Tech Provider ya kisi partner (BSP) ke zariye milta hai. Agar direct option na mile, to do raste hain: (1) vendor ke liye naya SIM number "order line", ya (2) baad mein Tech Provider banna. **Pehle vendor ke setup pe ye zaroor check karein.**
   - Number ko API pe register karne ke baad, coexistence ke baghair, wo number WhatsApp Business App mein nahi chalega.
5. **Permanent token** (ye expire nahi hota):
   - business.facebook.com → **Settings → Users → System users → Add**. Naam rakhein, role **Admin**.
   - **Assign assets:** app aur WhatsApp account, dono pe full control.
   - **Generate token:** app chunein, expiry **Never**, permissions `whatsapp_business_messaging` aur `whatsapp_business_management`.
   - Token server ki `.env` mein daalein, jaise `WA_TOKEN_<VENDOR>=...`. **Ye token kisi ko na dikhayein.**
6. Webhook set karein (A ka step 7), usi server ke URL ke saath.
7. **Payment method:** Meta ka bill vendor ke card se, WhatsApp Manager → Payment settings. Har number ko har mahine 1,000 service messages free milte hain.
8. **Business verification** (baad mein, free): vendor ke shop documents se, jaise utility bill ya NTN. Is se limits barh jaati hain.

## Kharcha yaad rakhein
- Customer ka message aana: free.
- Bot ka jawab, 24 ghante ki window ke andar: har number ke pehle 1,000 free, phir ~PKR 4 per message (rate Meta ki official pricing page pe check karein).
- Kitchen/rider screen: free (WhatsApp use hi nahi hota).
