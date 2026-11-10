# Oracle Cloud "Always Free" server pe deploy (24/7, PKR 0)

1–2 vendors ke liye Oracle ka Always Free VM kaafi hai. Vendors barhein to yahi steps kisi bhi paid VPS (Hetzner, Contabo) pe chalte hain. Bas server badlega, code nahi.

> Oracle signup mein card verification hoti hai (chhota hold lag kar wapas ho jata hai). Kabhi kabhi free ARM server "out of capacity" bata deta hai. Aisa ho to dusra availability domain try karein, ya kuch ghante baad dobara koshish karein.

## 1. Server banana
1. **cloud.oracle.com** pe signup karein. Home region apne qareeb ka chunein; ye baad mein badalta nahi.
2. **Compute → Instances → Create instance**:
   - Image: **Ubuntu 24.04**
   - Shape: **Ampere (VM.Standard.A1.Flex)**, 1–2 OCPU aur 6–12 GB RAM. Ye Always Free mein hai.
   - "Always Free eligible" ka nishan zaroor dekhein.
   - **SSH key** download karein. Isi se server mein login hoga.
3. Server ban jaye to us ka **Public IP** note karein, jaise `140.238.1.2`.

## 2. Ports kholna (80 aur 443)
1. Instance → **Subnet → Security List → Add Ingress Rules**:
   - Source `0.0.0.0/0`, TCP, port **80**
   - Source `0.0.0.0/0`, TCP, port **443**
2. Ubuntu ke andar ka firewall bhi kholna hai. Ye agle step mein login ke baad hoga.

## 3. Login aur setup
Windows pe PowerShell ya WSL mein:

```bash
ssh -i path/to/key.pem ubuntu@140.238.1.2
```

Server ke andar firewall kholein:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
```

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
```

```bash
sudo netfilter-persistent save
```

Docker install karein:

```bash
curl -fsSL https://get.docker.com | sudo sh
```

```bash
sudo usermod -aG docker ubuntu
```

Logout kar ke dobara login karein, phir code laayein:

```bash
git clone -b claude/inspiring-tesla-idwpu8 https://github.com/tahirbaba/Tahir-s-Portfolio.git
```

(Branch merge ho jaye to `-b …` hata dein. Repo private ho to GitHub username aur personal access token maangega.)

```bash
cd Tahir-s-Portfolio/whatsapp-order-agent
```

## 4. Settings (.env)

```bash
cp .env.example .env
```

```bash
nano .env
```

Bharein:
- `ANTHROPIC_API_KEY`
- `WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET`
- Har vendor ka `WA_TOKEN_…` aur `OPS_KEY_…`. Ops key ke liye lambi random line chahiye, jo `openssl rand -hex 16` se ban jati hai.
- `DOMAIN=140-238-1-2.sslip.io`. Apne IP ke **dots ki jagah dashes** likhein. Ye free domain khud aap ke IP pe point karta hai, aur Caddy is ka HTTPS certificate khud le leta hai.
- `PUBLIC_URL=https://140-238-1-2.sslip.io`

Database folder ki permission set karein (container `node` user se chalta hai):

```bash
mkdir -p data && sudo chown -R 1000:1000 data
```

## 5. Chalayein

```bash
docker compose up -d --build
```

Check karein:

```bash
curl https://140-238-1-2.sslip.io/health
```

`{"ok":true,...}` aaye to server tayyar hai. Ab Meta mein webhook URL `https://140-238-1-2.sslip.io/webhook` set karein ([SETUP-META.md](SETUP-META.md)).

Kitchen screen ka link: `https://140-238-1-2.sslip.io/ops/demo-pizza?key=<OPS_KEY_DEMO_PIZZA>`. Ye link kitchen ke mobile pe bookmark kar dein.

## Rozana ke kaam

Logs dekhna:

```bash
docker compose logs -f app
```

Vendor file badli (menu ya price), to rebuild ki zaroorat nahi:

```bash
docker compose restart app
```

Naya code aaya:

```bash
git pull && docker compose up -d --build
```

Database ka backup (ek file):

```bash
mkdir -p backups && sqlite3 data/agent.db ".backup backups/agent-$(date +%F).db"
```

(`sqlite3` na ho to pehle `sudo apt install -y sqlite3`. Server chalte hue bhi ye backup safe hai.)

## Paid VPS pe shift karna (jab vendors barhein)
Naye server pe yahi steps 3–5 chalayein. Purane server se `data/agent.db`, `.env` aur `vendors/` copy karein, `DOMAIN` badlein, aur Meta mein webhook URL update karein.
