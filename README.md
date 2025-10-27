# 🚀 SEO Vitals Monitor - Lokalna Aplikacja

**Prosta lokalna aplikacja do monitorowania SEO Twoich domen.**

Uruchom gdy potrzebujesz, sprawdź domeny, zobacz zmiany - wszystko lokalnie na Twoim komputerze!

---

## ✨ Funkcjonalności

- ✅ **Automatyczny Web Crawler** - crawluje wszystkie strony w domenie
- ✅ **Monitorowanie Kodów HTTP** - 200, 301, 302, 404, 500, etc.
- ✅ **Wykrywanie Noindex/Nofollow** - meta robots i X-Robots-Tag
- ✅ **Robots.txt** - historia zmian
- ✅ **Wykrywanie Zmian** - porównuje crawle i pokazuje różnice
- ✅ **Health Score** - ocena zdrowia domeny 0-100
- ✅ **Piękny Dashboard** - Bootstrap UI
- ✅ **SQLite Database** - wszystkie dane lokalnie
- ✅ **Historia** - pełna historia wszystkich crawli

---

## 🎯 Wymagania

- **Python 3.8+**
- System: Windows, macOS, Linux

To wszystko! 🎉

---

## 🚀 Szybki Start (2 kroki!)

### Windows:

1. **Pobierz projekt**
2. **Dwuklik na `uruchom.bat`**

Gotowe! Dashboard otworzy się na http://localhost:5000

### Linux / macOS:

1. **Pobierz projekt**
2. **Uruchom:** `./uruchom.sh`

Gotowe! Dashboard otworzy się na http://localhost:5000

---

## 📖 Szczegółowa Instalacja

### 1. Sklonuj repo (jeśli używasz Git):

```bash
git clone https://github.com/twoje-repo/seo-vitals-monitor
cd seo-vitals-monitor
```

Lub po prostu **pobierz ZIP** i rozpakuj.

### 2. Uruchom aplikację:

**Windows:**
```bash
# Dwuklik na:
uruchom.bat
```

**Linux/macOS:**
```bash
chmod +x uruchom.sh
./uruchom.sh
```

Przy pierwszym uruchomieniu:
- Utworzy się środowisko wirtualne Python (venv)
- Zainstalują się wszystkie zależności
- Uruchomi się aplikacja

**Przy kolejnych uruchomieniach** - po prostu kliknij launcher!

---

## 💻 Użycie

### 1. Otwórz Dashboard

Po uruchomieniu aplikacji, otwórz przeglądarkę:

```
http://localhost:5000
```

### 2. Dodaj Domenę

1. Kliknij **"Dodaj Domenę"**
2. Wpisz nazwę (np. "Moja Strona")
3. Wpisz URL (np. "https://example.com")
4. Kliknij **"Dodaj"**

### 3. Uruchom Crawl

1. Na karcie domeny kliknij **"Uruchom Crawl"**
2. Poczekaj aż crawl się zakończy
3. Zobacz wyniki!

### 4. Zobacz Wyniki

Dashboard pokazuje:
- 📊 **Health Score** - ocena zdrowia domeny
- 📄 **Wszystkie strony** z kodami HTTP
- ⚠️ **Wykryte problemy** - 404, 500, noindex
- 🔄 **Zmiany** - co się zmieniło od ostatniego crawla
- 📝 **Robots.txt** - historia zmian

---

## 📁 Struktura Projektu

```
seo-vitals-monitor/
├── app.py                 # Główna aplikacja Flask
├── crawler.py             # Web crawler
├── database.py            # SQLite database handling
├── requirements.txt       # Python dependencies
├── uruchom.bat           # Windows launcher
├── uruchom.sh            # Linux/macOS launcher
├── templates/            # HTML templates
│   ├── base.html
│   ├── index.html
│   ├── domain.html
│   ├── crawl.html
│   └── add_domain.html
├── static/               # CSS, JS (opcjonalnie)
└── data/                # SQLite database (auto-created)
    └── seo_monitor.db
```

---

## 🔧 Zaawansowane

### Ręczne uruchomienie (bez launchera):

```bash
# Utwórz venv
python -m venv venv

# Aktywuj venv
# Windows:
venv\Scripts\activate.bat
# Linux/macOS:
source venv/bin/activate

# Zainstaluj zależności
pip install -r requirements.txt

# Uruchom
python app.py
```

### Zmiana portu:

Edytuj ostatnią linię w `app.py`:

```python
app.run(debug=True, host='0.0.0.0', port=5000)  # Zmień port tutaj
```

### Backup bazy danych:

Baza danych znajduje się w:
```
data/seo_monitor.db
```

Po prostu skopiuj ten plik aby zrobić backup!

---

## 🐛 Troubleshooting

### Problem: "Python nie jest zainstalowany"

**Rozwiązanie:**
1. Pobierz Python: https://www.python.org/downloads/
2. Zainstaluj (zaznacz "Add Python to PATH"!)
3. Uruchom ponownie terminal

### Problem: "Błąd instalacji zależności"

**Rozwiązanie:**
```bash
# Zaktualizuj pip
python -m pip install --upgrade pip

# Zainstaluj ponownie
pip install -r requirements.txt
```

### Problem: "Port 5000 jest zajęty"

**Rozwiązanie:**
- Zmień port w `app.py` (patrz sekcja Zaawansowane)
- Lub zamknij aplikację która używa portu 5000

### Problem: "Crawler nie działa"

**Rozwiązanie:**
- Sprawdź połączenie z internetem
- Sprawdź czy URL domeny jest poprawny (z https://)
- Sprawdź czy strona jest dostępna

---

## 📊 Przykładowe Użycie

### Scenario 1: Audyt SEO

1. Dodaj domenę klienta
2. Uruchom crawl (max 100-500 stron)
3. Zobacz wszystkie problemy:
   - Strony 404
   - Strony z noindex
   - Przekierowania
   - Błędy serwera

### Scenario 2: Monitoring Zmian

1. Wykonaj pierwszy crawl (baseline)
2. Tydzień później wykonaj drugi crawl
3. Zobacz co się zmieniło:
   - Nowe/usunięte strony
   - Zmiany statusów
   - Nowe tagi noindex
   - Zmiany w robots.txt

### Scenario 3: Raportowanie

1. Wykonaj crawl
2. Zobacz statystyki w Dashboard
3. Eksportuj dane z bazy SQLite (np. DB Browser)

---

## 🎯 FAQ

**Q: Czy aplikacja działa 24/7?**
A: Nie - działa tylko gdy ją uruchomisz. Idealny dla użytku na żądanie!

**Q: Czy dane są wysyłane do chmury?**
A: Nie - wszystko jest lokalnie na Twoim komputerze.

**Q: Ile domen mogę monitorować?**
A: Nieograniczoną liczbę! Zależy tylko od miejsca na dysku.

**Q: Czy mogę to używać komercyjnie?**
A: Tak! Licencja MIT.

**Q: Czy mogę to zmodyfikować?**
A: Oczywiście! To open source.

---

## 🤝 Contributing

Pull requesty mile widziane!

---

## 📄 Licencja

MIT License - możesz robić z tym co chcesz!

---

## 🙏 Credits

Zbudowane z:
- Flask
- BeautifulSoup4
- Bootstrap 5
- SQLite

---

**Zbudowane z ❤️ dla specjalistów SEO**

Pytania? Problemy? Otwórz issue na GitHub!
