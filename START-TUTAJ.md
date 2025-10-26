# 🚀 ZACZNIJ TUTAJ - Szybki Start

## Witaj! 👋

Masz teraz **kompleksowy dashboard SEO** który może monitorować Twoje domeny **24/7 całkowicie za darmo**!

---

## ❓ Co to za aplikacja?

**SEO Vitals Monitor** to system który:
- ✅ Automatycznie **crawluje Twoje domeny** co 2 dni
- ✅ Sprawdza **wszystkie kody HTTP** (200, 404, 301, 500, etc.)
- ✅ Wykrywa **noindex/nofollow** tagi
- ✅ Monitoruje **robots.txt** i jego zmiany
- ✅ Wykrywa **redirecty** i ich zmiany
- ✅ Porównuje **crawle** i pokazuje co się zmieniło
- ✅ Wysyła **alerty email** gdy coś się zmienia
- ✅ Zapisuje **pełną historię** wszystkich zmian

**Idealny dla:** Specjalistów SEO, webmasterów, właścicieli stron

---

## 🎯 KROK 1: Wybierz opcję hostingu (100% ZA DARMO!)

Masz **3 opcje za darmo**. Która jest dla Ciebie?

### 🥇 Opcja A: **Fly.io** (POLECAM!) ⭐

**Najlepsze jeśli:**
- ✅ Chcesz prawdziwego monitoringu 24/7
- ✅ Potrzebujesz automatycznego crawlingu co 2 dni
- ✅ Masz 5-50 domen do monitorowania
- ✅ Chcesz natychmiastowych alertów

**Koszty:** 0 zł/miesiąc (całkowicie darmowe!)

**Setup:**
1. Otwórz: **[FLY-SETUP-DARMOWE.md](FLY-SETUP-DARMOWE.md)**
2. Postępuj krok po kroku (20-30 minut)
3. Gotowe!

---

### 🥈 Opcja B: **Render.com** (Najprostsze!)

**Najlepsze jeśli:**
- ✅ Chcesz najprostszy setup (jak Netlify)
- ✅ Testujesz aplikację lub pokazujesz demo
- ✅ Masz 1-5 domen
- ✅ Możesz poczekać 1-2 min na załadowanie (po uśpieniu)
- ⚠️ **Uwaga:** Usypia po 15 min bez aktywności

**Koszty:** 0 zł/miesiąc (darmowy plan)

**Setup:**
1. Otwórz: **[RENDER-FREE-SETUP.md](RENDER-FREE-SETUP.md)**
2. Postępuj krok po kroku (15-20 minut)
3. Gotowe!

---

### 🥉 Opcja C: **Localhost (Docker)**

**Najlepsze jeśli:**
- ✅ Masz komputer który działa 24/7 (serwer domowy, NAS)
- ✅ Chcesz testować lokalnie
- ✅ Nie potrzebujesz dostępu z zewnątrz

**Koszty:** 0 zł/miesiąc (tylko prąd Twojego komputera)

**Setup:**
```bash
# W folderze projektu
cp .env.example .env
# Edytuj .env jeśli potrzebujesz

docker-compose up -d
docker-compose exec app npx prisma migrate deploy

# Otwórz
open http://localhost:3000
```

---

## 🤔 Nie wiesz którą opcję wybrać?

**Odpowiedz na 3 pytania:**

### 1. Potrzebujesz prawdziwego monitoringu 24/7?
- **TAK** → Fly.io (opcja A) ⭐
- **NIE (tylko testy)** → Render (opcja B)

### 2. Chcesz najprostszy setup (bez terminala)?
- **TAK** → Render (opcja B)
- **NIE (terminal OK)** → Fly.io (opcja A) ⭐

### 3. Masz komputer 24/7 w domu?
- **TAK** → Localhost (opcja C)
- **NIE** → Fly.io (opcja A) ⭐

**📊 Szczegółowe porównanie:** [DARMOWE-OPCJE-POROWNANIE.md](DARMOWE-OPCJE-POROWNANIE.md)

---

## 📚 KROK 2: Postępuj według przewodnika

Wybrałeś opcję? Teraz otwórz odpowiedni plik:

- **Fly.io** → [FLY-SETUP-DARMOWE.md](FLY-SETUP-DARMOWE.md)
- **Render** → [RENDER-FREE-SETUP.md](RENDER-FREE-SETUP.md)
- **Localhost** → Patrz wyżej lub [README.md](README.md)

Każdy przewodnik ma **szczegółowe instrukcje krok po kroku** z screenshotami i przykładami.

---

## ✅ KROK 3: Użyj aplikacji!

Po wdrożeniu, aplikacja będzie dostępna pod:

- **Fly.io:** `https://twoja-nazwa.fly.dev`
- **Render:** `https://twoja-nazwa.onrender.com`
- **Localhost:** `http://localhost:3000`

### Co zrobić w aplikacji:

1. **Dodaj pierwszą domenę:**
   - Kliknij "Add Domain"
   - Wypełnij: nazwa, URL, częstotliwość crawlingu
   - Kliknij "Create Domain"

2. **Uruchom pierwszy crawl:**
   - Kliknij ikonę "Refresh" na karcie domeny
   - Poczekaj kilka minut (zależnie od wielkości strony)

3. **Zobacz wyniki:**
   - Kliknij "View Details"
   - Zobacz wszystkie strony, kody HTTP, problemy SEO
   - Sprawdź wykryte zmiany

4. **Skonfiguruj alerty (opcjonalne):**
   - Przejdź do "Alerts"
   - Dodaj alert email gdy noindex zostanie dodany
   - Dodaj alert gdy strona zwróci 404

5. **Gotowe!** 🎉
   - Aplikacja teraz automatycznie crawluje co 2 dni
   - Wykrywa zmiany
   - Wysyła alerty
   - Zapisuje historię

---

## 📖 Dodatkowa Dokumentacja

- **[README.md](README.md)** - Pełna dokumentacja projektu
- **[SETUP.md](SETUP.md)** - Szczegółowy przewodnik setup (dla VPS)
- **[DARMOWE-OPCJE-POROWNANIE.md](DARMOWE-OPCJE-POROWNANIE.md)** - Porównanie darmowych opcji

---

## 🎯 Quick Reference

### Uruchomione? Sprawdź te linki:

**Dashboard:**
- Lista domen z health scores
- Statystyki i metryki
- Historia crawli

**API Endpoints:**
```
GET  /api/domains          - Lista domen
POST /api/domains          - Dodaj domenę
GET  /api/domains/:id      - Szczegóły domeny
POST /api/crawl/trigger    - Uruchom crawl
GET  /api/crawl/:id/pages  - Wszystkie strony z crawla
GET  /api/crawl/:id/changes - Zmiany wykryte
```

### Ważne zmienne środowiskowe:

```env
# Baza danych (automatycznie ustawiona w Fly.io/Render)
DATABASE_URL=postgresql://...

# Redis (automatycznie ustawione)
REDIS_HOST=...
REDIS_PORT=6379
REDIS_PASSWORD=...

# Email alerts (opcjonalne - musisz dodać)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=twoj-email@gmail.com
EMAIL_PASSWORD=twoje-app-password
```

---

## 🐛 Problemy?

### Aplikacja nie startuje
1. Sprawdź logi (w Fly.io: `fly logs`, w Render: Dashboard → Logs)
2. Upewnij się że wszystkie zmienne środowiskowe są ustawione
3. Sprawdź czy baza danych działa

### Worker nie crawluje automatycznie
1. Sprawdź czy Worker service działa
2. Sprawdź logi workera
3. Upewnij się że Worker ma te same zmienne co aplikacja

### Email alerty nie działają
1. Dla Gmail: użyj "App Password" (nie zwykłe hasło)
2. Sprawdź spam folder
3. Sprawdź czy EMAIL_* zmienne są poprawne

---

## 💬 Potrzebujesz pomocy?

1. Sprawdź dokumentację w tym repo
2. Zobacz logi aplikacji
3. Sprawdź status wszystkich serwisów

---

## 🎊 Gotowe!

Teraz masz **działający system monitorowania SEO 24/7**!

Co się dzieje automatycznie:
- ✅ Crawlowanie domen co 2 dni
- ✅ Wykrywanie zmian i problemów
- ✅ Wysyłanie alertów
- ✅ Zapisywanie pełnej historii
- ✅ Wszystko za 0 zł!

**Powodzenia z monitorowaniem!** 🚀

---

## 🗺️ Roadmap (przyszłe funkcje)

- [ ] Lighthouse integration
- [ ] Core Web Vitals
- [ ] JavaScript rendering
- [ ] Multi-language
- [ ] Slack/Discord integration
- [ ] Mobile app

---

**Zbudowane z ❤️ dla specjalistów SEO**
