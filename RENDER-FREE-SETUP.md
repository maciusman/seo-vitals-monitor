# 🆓 Render.com Free Tier - 100% ZA DARMO (z ograniczeniami)

## ⚠️ WAŻNE - Przeczytaj to najpierw!

**Render Free Tier ma ograniczenie:**
- ⏸️ **Aplikacja "usypia" po 15 minutach braku aktywności**
- 🐌 **Pierwsze uruchomienie po uśpieniu trwa ~1-2 minuty**
- ⚠️ **Worker może nie działać idealnie 24/7**

**Ale:**
- ✅ **Całkowicie za darmo**
- ✅ **PostgreSQL darmowy (90 dni, potem wymaga karty ale dalej $0)**
- ✅ **Redis darmowy przez Upstash**
- ✅ **Dobry do testów**

---

## 🎯 Dla kogo to rozwiązanie?

✅ **Dobrze jeśli:**
- Testujesz aplikację
- Masz małą liczbę domen (1-5)
- Możesz poczekać 1-2 min na pierwsze załadowanie
- Sprawdzasz domeny ręcznie (nie musisz 24/7)

❌ **NIE dla Ciebie jeśli:**
- Potrzebujesz prawdziwego monitoringu 24/7
- Masz dużo domen
- Potrzebujesz natychmiastowych alertów

**Jeśli potrzebujesz prawdziwego 24/7, użyj Fly.io (też darmowe!)** → Zobacz `FLY-SETUP-DARMOWE.md`

---

## 🚀 Setup Render.com

### KROK 1: Utwórz konto

1. Idź na: **https://render.com**
2. Kliknij **"Get Started"**
3. Zaloguj się przez **GitHub** (tak jak Netlify!)

✅ **Konto utworzone!**

---

### KROK 2: Połącz repo GitHub

1. W Render Dashboard kliknij **"New +"**
2. Wybierz **"Web Service"**
3. Kliknij **"Connect GitHub"** i daj dostęp
4. Znajdź repo: **`seo-vitals-monitor`**
5. Wybierz branch: **`claude/seo-domain-monitoring-dashboard-011CUVsJyAG8qZtK2bGAHYGd`**
6. Kliknij **"Connect"**

---

### KROK 3: Konfiguracja Web Service

Wypełnij formularz:

```yaml
Name: seo-vitals-monitor
Region: Frankfurt (lub najbliższy)
Branch: claude/seo-domain-monitoring-dashboard-011CUVsJyAG8qZtK2bGAHYGd
Root Directory: (zostaw puste)
Environment: Docker
Instance Type: Free
```

**NIE KLIKAJ jeszcze "Create Web Service"!**

---

### KROK 4: Utwórz PostgreSQL (DARMOWY)

1. Wróć do Dashboard
2. Kliknij **"New +"** → **"PostgreSQL"**
3. Wypełnij:
   ```yaml
   Name: seo-vitals-db
   Region: Frankfurt (ten sam co aplikacja!)
   PostgreSQL Version: 16
   Instance Type: Free
   ```
4. Kliknij **"Create Database"**

Poczekaj ~2 minuty aż database będzie gotowy.

**Skopiuj "Internal Database URL"** - będzie potrzebny!

✅ **PostgreSQL gotowy!**

---

### KROK 5: Utwórz Redis (DARMOWY przez Upstash)

1. Idź na: **https://upstash.com**
2. Zaloguj się przez GitHub
3. Kliknij **"Create Database"**
4. Wybierz:
   ```yaml
   Name: seo-vitals-redis
   Type: Regional
   Region: Europe (wybierz najbliższy)
   Price: Free (256 MB)
   ```
5. Kliknij **"Create"**

**Skopiuj:**
- Endpoint (REDIS_HOST i REDIS_PORT)
- Password (REDIS_PASSWORD)

✅ **Redis gotowy!**

---

### KROK 6: Dodaj zmienne środowiskowe do Web Service

Wróć do konfiguracji Web Service (Krok 3) i przewiń do **"Environment Variables"**.

Dodaj wszystkie te zmienne:

```env
# Database (skopiuj z Render PostgreSQL)
DATABASE_URL=<Internal Database URL z Kroku 4>

# Redis (skopiuj z Upstash)
REDIS_HOST=<twój-endpoint>.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=<twoje-password>

# App URL (zmień na swoją nazwę)
NEXT_PUBLIC_APP_URL=https://seo-vitals-monitor.onrender.com

# Email (opcjonalne)
EMAIL_FROM=alerts@twoja-domena.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=twoj-email@gmail.com
EMAIL_PASSWORD=twoje-app-password

# Crawler
CRAWLER_USER_AGENT=SEO-Vitals-Monitor/1.0
```

---

### KROK 7: Deploy aplikacji

1. Kliknij **"Create Web Service"**
2. Render zacznie budować aplikację (to potrwa 10-15 min)
3. Poczekaj aż status będzie: **"Live"** ✅

---

### KROK 8: Uruchom migracje bazy danych

Po pierwszym deploy:

1. Kliknij na swoją aplikację
2. Przejdź do zakładki **"Shell"**
3. Kliknij **"Launch Shell"**
4. Wpisz i uruchom:
   ```bash
   npx prisma migrate deploy
   ```
5. Poczekaj aż zakończone ✅

---

### KROK 9: (Opcjonalnie) Utwórz Worker

⚠️ **Problem:** Render Free Worker też będzie usypiał.

**Rozwiązania:**
1. **Nie twórz workera** - triggeruj crawle ręcznie z dashboardu
2. **Użyj cron-job.org** (darmowy) aby "budzić" workera co 2 dni
3. **Użyj Fly.io dla workera** (darmowy, działa 24/7) - patrz FLY-SETUP-DARMOWE.md

**Jeśli chcesz workera na Render (będzie usypiał):**

1. Kliknij **"New +"** → **"Background Worker"**
2. Wybierz to samo repo i branch
3. Konfiguracja:
   ```yaml
   Name: seo-vitals-worker
   Environment: Docker
   Docker Command: npm run worker
   Instance Type: Free
   ```
4. Dodaj te same zmienne środowiskowe
5. Kliknij **"Create Background Worker"**

---

### KROK 10: Otwórz aplikację!

Twoja aplikacja jest dostępna pod:
**https://twoja-nazwa.onrender.com**

---

## ⚠️ Ograniczenia Render Free Tier:

- ⏸️ **Usypia po 15 min** braku aktywności
- 🐌 **Cold start:** 1-2 minuty przy pierwszym uruchomieniu
- 🔄 **750 godzin/mies** (wystarczy ale usypia)
- 💾 **1GB disk**
- 📊 **100GB bandwidth/mies**

---

## 💡 Jak "obudzić" aplikację automatycznie?

### Opcja A: Cron-Job.org (darmowy!)

1. Idź na: **https://cron-job.org**
2. Zarejestruj się (za darmo)
3. Utwórz nowy cron job:
   - URL: `https://twoja-aplikacja.onrender.com/api/domains`
   - Schedule: Co 10 minut
4. To będzie "pingować" aplikację żeby nie zasnęła!

### Opcja B: UptimeRobot (darmowy!)

1. Idź na: **https://uptimerobot.com**
2. Dodaj monitor:
   - Type: HTTP(s)
   - URL: `https://twoja-aplikacja.onrender.com`
   - Interval: 5 minutes
3. To też będzie budzić aplikację!

---

## 🎯 Podsumowanie Render Free:

**✅ Zalety:**
- Całkowicie darmowy
- Łatwy setup (jak Netlify)
- GitHub integration
- Auto-deploy

**❌ Wady:**
- Usypia po 15 min
- Cold start 1-2 min
- Worker może nie działać idealnie 24/7

**Rekomendacja:**
Jeśli potrzebujesz prawdziwego 24/7, użyj **Fly.io** (też darmowe!) → `FLY-SETUP-DARMOWE.md`

---

## 📊 Porównanie Darmowych Opcji:

| Feature | Fly.io | Render Free |
|---------|--------|-------------|
| **Koszt** | 0 zł | 0 zł |
| **Usypianie** | ❌ NIE | ✅ TAK (15 min) |
| **24/7** | ✅ TAK | ❌ NIE |
| **PostgreSQL** | ✅ 3GB | ✅ Darmowy |
| **Redis** | ✅ 256MB | ✅ (Upstash) |
| **Cold Start** | ~5s | ~1-2 min |
| **Worker 24/7** | ✅ TAK | ❌ NIE |
| **Dla kogo** | Production | Testing |

**Moja rekomendacja: Fly.io!** ⭐

---

## 🔄 Auto-Deploy

Render automatycznie deploy'uje przy każdym push do GitHub!

```bash
git add .
git commit -m "Moja zmiana"
git push
# Render automatycznie zrobi redeploy!
```

**Powodzenia!** 🚀
