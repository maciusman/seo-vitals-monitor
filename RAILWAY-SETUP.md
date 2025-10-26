# 🚂 Railway Setup - Krok po Kroku (SUPER PROSTE!)

Railway jest jak Netlify, ale wspiera wszystko czego potrzebujemy! Ten przewodnik poprowadzi Cię przez cały proces.

## ✅ Co Railway da Ci automatycznie:

- ✅ Hosting 24/7
- ✅ PostgreSQL Database
- ✅ Redis
- ✅ Auto-deploy z GitHub (jak Netlify!)
- ✅ SSL Certificate (HTTPS)
- ✅ Wszystko w jednym miejscu

**Koszt:** ~$10-15/mies (pierwsze $5 GRATIS)

---

## 📋 KROK 1: Utwórz konto Railway

1. Idź na: **https://railway.app**
2. Kliknij **"Start a New Project"** lub **"Sign up"**
3. Zaloguj się przez **GitHub** (tak jak na Netlify!)
4. Railway poprosi o dostęp do Twoich repo - **Zaakceptuj**

✅ **Gotowe! Konto utworzone.**

---

## 🗄️ KROK 2: Dodaj PostgreSQL Database

1. W Railway Dashboard kliknij **"+ New"**
2. Wybierz **"Database"**
3. Wybierz **"Add PostgreSQL"**
4. Railway automatycznie utworzy bazę danych!

✅ **PostgreSQL gotowy!**

---

## 🔴 KROK 3: Dodaj Redis

1. Znowu kliknij **"+ New"**
2. Wybierz **"Database"**
3. Wybierz **"Add Redis"**
4. Railway automatycznie utworzy Redis!

✅ **Redis gotowy!**

---

## 🚀 KROK 4: Deploy Aplikacji z GitHub

1. W Railway Dashboard kliknij **"+ New"**
2. Wybierz **"GitHub Repo"**
3. Znajdź swoje repo: **`seo-vitals-monitor`**
4. Wybierz branch: **`claude/seo-domain-monitoring-dashboard-011CUVsJyAG8qZtK2bGAHYGd`**
5. Kliknij **"Deploy"**

Railway zacznie budować aplikację automatycznie!

✅ **Aplikacja deploying...**

---

## ⚙️ KROK 5: Połącz Database z Aplikacją

Teraz musimy powiedzieć aplikacji gdzie jest baza danych:

### 5.1 Otwórz ustawienia aplikacji
1. Kliknij na **swoją aplikację** (nie database!)
2. Przejdź do zakładki **"Variables"**

### 5.2 Dodaj zmienne środowiskowe

Kliknij **"+ New Variable"** i dodaj każdą z poniższych:

**WAŻNE: Te wartości znajdziesz klikając na PostgreSQL i Redis w Twoim Railway Dashboard!**

```env
# 1. DATABASE_URL
# Źródło: Kliknij na "PostgreSQL" → zakładka "Connect" → skopiuj "DATABASE_URL"
DATABASE_URL=<skopiuj z PostgreSQL>

# 2. REDIS_HOST
# Źródło: Kliknij na "Redis" → zakładka "Connect" → skopiuj "Host"
REDIS_HOST=<skopiuj z Redis>

# 3. REDIS_PORT
# Źródło: Kliknij na "Redis" → zakładka "Connect" → skopiuj "Port"
REDIS_PORT=<skopiuj z Redis>

# 4. REDIS_PASSWORD
# Źródło: Kliknij na "Redis" → zakładka "Connect" → skopiuj "Password"
REDIS_PASSWORD=<skopiuj z Redis>

# 5. App URL (będzie dostępny po pierwszym deploy)
NEXT_PUBLIC_APP_URL=https://twoja-aplikacja.railway.app

# 6. Email (opcjonalne - dla alertów)
EMAIL_FROM=alerts@twoja-domena.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=twoj-email@gmail.com
EMAIL_PASSWORD=twoje-hasło-aplikacji

# 7. Crawler
CRAWLER_USER_AGENT=SEO-Vitals-Monitor/1.0
```

### 5.3 Zapisz zmienne
Kliknij **"Add"** dla każdej zmiennej.

✅ **Zmienne dodane!**

---

## 🔧 KROK 6: Dodaj Worker (dla background jobs)

Worker to oddzielny proces który crawluje domeny co 2 dni.

### 6.1 Utwórz nowy service
1. W Railway Dashboard kliknij **"+ New"**
2. Wybierz **"GitHub Repo"**
3. Wybierz to samo repo: **`seo-vitals-monitor`**
4. Wybierz ten sam branch
5. Kliknij **"Deploy"**

### 6.2 Zmień start command na worker
1. Kliknij na **nowy service** (będzie miał taką samą nazwę - przemianuj go na "Worker")
2. Przejdź do **"Settings"**
3. Znajdź **"Start Command"**
4. Zmień na: **`npm run worker`**
5. Kliknij **"Save"**

### 6.3 Dodaj te same zmienne do Workera
1. Przejdź do zakładki **"Variables"**
2. Dodaj **dokładnie te same** zmienne co w Kroku 5.2
   (lub użyj przycisku "Reference" aby wskazać na zmienne z głównej aplikacji)

✅ **Worker gotowy!**

---

## 🎉 KROK 7: Sprawdź czy działa!

### 7.1 Znajdź URL aplikacji
1. Kliknij na **główną aplikację** (nie Worker!)
2. Przejdź do zakładki **"Settings"**
3. Znajdź **"Domains"**
4. Skopiuj URL: `https://twoja-aplikacja.railway.app`

### 7.2 Otwórz w przeglądarce
Wklej URL do przeglądarki i powinieneś zobaczyć dashboard!

### 7.3 Sprawdź logi
1. Kliknij na **aplikację**
2. Przejdź do zakładki **"Deployments"**
3. Kliknij na najnowszy deployment
4. Sprawdź logi - powinny pokazywać że aplikacja działa

✅ **Działa 24/7!** 🎊

---

## 📱 KROK 8: Dodaj swoją pierwszą domenę!

1. Otwórz dashboard: `https://twoja-aplikacja.railway.app`
2. Kliknij **"Add Domain"**
3. Wypełnij formularz:
   - **Domain Name**: Moja Strona
   - **URL**: https://example.com
   - **Crawl Frequency**: 2 dni
4. Kliknij **"Create Domain"**
5. Kliknij ikonę **"Refresh"** aby rozpocząć pierwszy crawl

Aplikacja automatycznie:
- ✅ Wykona pierwszy crawl
- ✅ Będzie crawlować co 2 dni automatycznie
- ✅ Będzie wykrywać zmiany
- ✅ Będzie wysyłać alerty (jeśli skonfigurowałeś email)

---

## 🔄 Auto-Deploy (jak na Netlify!)

Railway automatycznie deploy'uje każdą zmianę z GitHub!

```bash
# Na swoim komputerze
git add .
git commit -m "Moja zmiana"
git push

# Railway automatycznie wykryje zmianę i zrobi redeploy!
```

✅ **Jak Netlify - zero konfiguracji!**

---

## 💰 Koszty

Railway działa na modelu "pay as you go":

- **$5 darmowych kredytów** każdego miesiąca
- Typowy koszt dla tej aplikacji: **~$10-15/mies**
  - PostgreSQL: ~$5
  - Redis: ~$2
  - App + Worker: ~$5-8

**Pierwsze $5 gratis = pierwszy miesiąc prawie za darmo!**

---

## 🛠️ Troubleshooting

### Problem: Aplikacja nie startuje
**Rozwiązanie:**
1. Sprawdź logi w Railway Dashboard
2. Upewnij się że dodałeś wszystkie zmienne środowiskowe
3. Sprawdź czy DATABASE_URL i REDIS są poprawne

### Problem: Worker nie działa
**Rozwiązanie:**
1. Sprawdź czy Worker ma start command: `npm run worker`
2. Sprawdź logi Workera
3. Upewnij się że Worker ma te same zmienne środowiskowe

### Problem: Email alerty nie działają
**Rozwiązanie:**
1. Dla Gmail: użyj "App Password" zamiast zwykłego hasła
2. Sprawdź spam folder
3. Upewnij się że EMAIL_* zmienne są poprawne

### Problem: Nie mogę się połączyć z bazą
**Rozwiązanie:**
1. Sprawdź czy DATABASE_URL zawiera wszystkie części
2. Sprawdź czy PostgreSQL service działa w Railway Dashboard

---

## ✅ Checklist - Co powinieneś mieć:

- [ ] Konto Railway utworzone
- [ ] PostgreSQL database dodany
- [ ] Redis dodany
- [ ] Aplikacja z GitHub deployed
- [ ] Worker service deployed
- [ ] Wszystkie zmienne środowiskowe dodane
- [ ] Aplikacja działa pod Railway URL
- [ ] Pierwsza domena dodana i crawlowana

---

## 🎊 Gotowe!

Twoja aplikacja działa **24/7** automatycznie!

**Co się dzieje teraz:**
- ✅ Railway hostuje aplikację non-stop
- ✅ Worker automatycznie crawluje domeny co 2 dni
- ✅ Zmiany są wykrywane i zapisywane
- ✅ Alerty są wysyłane automatycznie
- ✅ Każdy push do GitHub automatycznie deploy'uje nową wersję

**Linki:**
- Dashboard: https://railway.app (zarządzanie)
- Twoja aplikacja: https://twoja-aplikacja.railway.app
- Dokumentacja Railway: https://docs.railway.app

---

## 📞 Potrzebujesz pomocy?

Jeśli coś nie działa:
1. Sprawdź logi w Railway Dashboard (zakładka "Deployments")
2. Sprawdź czy wszystkie services są "Running" (zielone)
3. Sprawdź czy zmienne środowiskowe są poprawne

**Powodzenia!** 🚀
