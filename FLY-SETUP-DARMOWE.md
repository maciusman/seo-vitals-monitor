# 🆓 Fly.io Setup - 100% ZA DARMO!

## ✅ Co jest za darmo na Fly.io:

- ✅ **3 aplikacje** (256MB RAM każda) - używamy 2 (App + Worker)
- ✅ **PostgreSQL** (3GB storage) - wystarczy na tysiące domen!
- ✅ **Redis** przez Upstash (256MB) - za darmo!
- ✅ **160GB transfer** miesięcznie
- ✅ **Działa 24/7** bez usypiania
- ✅ **SSL certificate** (HTTPS)
- ✅ **KOSZT: 0 ZŁ** 🎉

Źródło: https://fly.io/docs/about/pricing/

---

## 🚀 KROK PO KROKU:

### KROK 1: Zainstaluj Fly.io CLI

**Na Windows:**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**Na Mac:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Na Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

Po instalacji, zamknij i otwórz terminal ponownie.

---

### KROK 2: Zaloguj się do Fly.io

```bash
fly auth login
```

To otworzy przeglądarkę:
1. **Stwórz darmowe konto** (jeśli nie masz)
2. **Zaloguj się**
3. Wróć do terminala

✅ **Zalogowany!**

---

### KROK 3: Sklonuj repo lokalnie

```bash
# Sklonuj swoje repo
git clone https://github.com/maciusman/seo-vitals-monitor
cd seo-vitals-monitor

# Checkout odpowiedniego brancha
git checkout claude/seo-domain-monitoring-dashboard-011CUVsJyAG8qZtK2bGAHYGd
```

---

### KROK 4: Utwórz PostgreSQL (DARMOWE!)

```bash
# Utwórz darmowy PostgreSQL
fly postgres create --name seo-vitals-db --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 1

# Wybierz region najbliższy Tobie (np. Warsaw - waw)
```

Zapisz **connection string** - będzie Ci potrzebny!

✅ **PostgreSQL utworzony ZA DARMO!**

---

### KROK 5: Utwórz Redis (DARMOWE przez Upstash!)

```bash
# Połącz Fly.io z Upstash (darmowy Redis)
fly redis create --name seo-vitals-redis --plan free

# Wybierz ten sam region co wcześniej
```

✅ **Redis utworzony ZA DARMO!**

---

### KROK 6: Deploy głównej aplikacji

```bash
# Launch aplikacji
fly launch --no-deploy

# Odpowiedz na pytania:
# - App name: seo-vitals-monitor (lub twoja nazwa)
# - Region: wybierz najbliższy (np. waw dla Warsaw)
# - PostgreSQL: NIE (już mamy)
# - Redis: NIE (już mamy)

# Połącz z PostgreSQL
fly postgres attach seo-vitals-db

# To automatycznie doda DATABASE_URL!
```

---

### KROK 7: Dodaj zmienne środowiskowe

```bash
# Redis connection (skopiuj z poprzedniego kroku)
fly secrets set REDIS_HOST="<twój-redis-host>.upstash.io"
fly secrets set REDIS_PORT="6379"
fly secrets set REDIS_PASSWORD="<twoje-redis-password>"

# App URL (zamień na swoją nazwę aplikacji)
fly secrets set NEXT_PUBLIC_APP_URL="https://seo-vitals-monitor.fly.dev"

# Email (opcjonalne)
fly secrets set EMAIL_FROM="alerts@twoja-domena.com"
fly secrets set EMAIL_HOST="smtp.gmail.com"
fly secrets set EMAIL_PORT="587"
fly secrets set EMAIL_USER="twoj-email@gmail.com"
fly secrets set EMAIL_PASSWORD="twoje-app-password"

# Crawler
fly secrets set CRAWLER_USER_AGENT="SEO-Vitals-Monitor/1.0"
```

---

### KROK 8: Deploy!

```bash
# Deploy aplikacji
fly deploy

# To potrwa kilka minut...
# Fly.io zbuduje Docker image i uruchomi aplikację
```

Poczekaj aż zobaczysz: ✅ **"Successfully deployed!"**

---

### KROK 9: Uruchom migracje bazy danych

```bash
# Połącz się z aplikacją i uruchom migracje
fly ssh console

# W konsoli aplikacji:
npx prisma migrate deploy

# Wyjdź: Ctrl+D
```

✅ **Baza danych gotowa!**

---

### KROK 10: Utwórz Worker (dla crawlingu 24/7)

Worker to oddzielna aplikacja która crawluje domeny:

```bash
# Utwórz worker config
cat > fly-worker.toml << 'EOF'
app = "seo-vitals-worker"
primary_region = "waw"
kill_signal = "SIGINT"
kill_timeout = "5s"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[[vm]]
  memory = '256mb'
  cpu_kind = 'shared'
  cpus = 1

[processes]
  app = "npm run worker"
EOF

# Deploy worker
fly launch --name seo-vitals-worker --config fly-worker.toml --no-deploy

# Połącz z tą samą bazą
fly postgres attach seo-vitals-db --app seo-vitals-worker

# Dodaj te same sekrety do workera
fly secrets set REDIS_HOST="<twój-redis-host>" --app seo-vitals-worker
fly secrets set REDIS_PORT="6379" --app seo-vitals-worker
fly secrets set REDIS_PASSWORD="<password>" --app seo-vitals-worker

# Deploy worker
fly deploy --app seo-vitals-worker
```

✅ **Worker działa 24/7!**

---

### KROK 11: Otwórz aplikację!

```bash
# Otwórz w przeglądarce
fly open
```

Lub idź do: **https://twoja-nazwa.fly.dev**

---

## 🎊 GOTOWE - DZIAŁA 24/7 ZA DARMO!

### Co masz teraz:

✅ **Aplikacja działa 24/7**
✅ **PostgreSQL (3GB darmowy)**
✅ **Redis (256MB darmowy)**
✅ **Worker crawluje co 2 dni automatycznie**
✅ **SSL/HTTPS automatycznie**
✅ **0 ZŁ KOSZT!**

---

## 🔄 Auto-Deploy z GitHub

Możesz skonfigurować auto-deploy:

```bash
# Ustaw GitHub Actions
fly deploy --config fly.toml --remote-only
```

Teraz każdy push do GitHub automatycznie deploy'uje!

---

## 📊 Monitorowanie

```bash
# Zobacz logi aplikacji
fly logs

# Zobacz logi workera
fly logs --app seo-vitals-worker

# Status aplikacji
fly status

# Status workera
fly status --app seo-vitals-worker
```

---

## 💡 Przydatne komendy

```bash
# Restart aplikacji
fly apps restart

# Restart workera
fly apps restart seo-vitals-worker

# SSH do aplikacji
fly ssh console

# Sprawdź bazy danych
fly postgres connect -a seo-vitals-db
```

---

## ⚠️ Ograniczenia darmowego planu:

- ✅ 3 aplikacje (używasz 2: App + Worker)
- ✅ 256MB RAM per app (wystarczy!)
- ✅ 3GB storage PostgreSQL (dużo!)
- ✅ 256MB Redis (wystarczy!)
- ✅ 160GB transfer (ponad potrzeby!)

**Dla większości użytkowników to WYSTARCZY!**

---

## 🆙 Jeśli potrzebujesz więcej w przyszłości:

Fly.io ma transparentne ceny:
- Więcej RAM: ~$2/mies za 512MB
- Więcej storage: ~$0.15/GB/mies
- Ale na start **darmowy plan WYSTARCZY!**

---

## 🎯 Podsumowanie:

1. ✅ Zainstaluj Fly CLI
2. ✅ Zaloguj się (fly auth login)
3. ✅ Utwórz PostgreSQL (darmowy)
4. ✅ Utwórz Redis (darmowy przez Upstash)
5. ✅ Deploy aplikacji (fly launch + fly deploy)
6. ✅ Deploy workera (druga aplikacja)
7. ✅ Otwórz i używaj!

**KOSZT: 0 ZŁ** 🎉

---

## 📞 Potrzebujesz pomocy?

Jeśli coś nie działa:

```bash
# Sprawdź logi
fly logs

# Sprawdź status
fly status

# Sprawdź czy wszystko działa
fly checks list
```

Lub sprawdź dokumentację: https://fly.io/docs/

**Powodzenia!** 🚀
