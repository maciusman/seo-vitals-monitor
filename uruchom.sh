#!/bin/bash

# Kolory
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "========================================"
echo "  SEO VITALS MONITOR"
echo "  Lokalna Aplikacja do Monitoringu SEO"
echo "========================================"
echo -e "${NC}"

# Sprawdź czy Python jest zainstalowany
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[BŁĄD] Python3 nie jest zainstalowany!${NC}"
    echo "Zainstaluj Python3 używając menedżera pakietów twojego systemu"
    exit 1
fi

echo -e "${GREEN}[OK] Python3 zainstalowany${NC}"

# Sprawdź czy folder venv istnieje
if [ ! -d "venv" ]; then
    echo "[INFO] Tworzenie środowiska wirtualnego..."
    python3 -m venv venv
    echo -e "${GREEN}[OK] Środowisko wirtualne utworzone${NC}"
fi

# Aktywuj venv
echo "[INFO] Aktywacja środowiska wirtualnego..."
source venv/bin/activate

# Sprawdź czy requirements są zainstalowane
if [ ! -f "venv/lib/python*/site-packages/flask/__init__.py" ]; then
    echo "[INFO] Instalacja zależności..."
    pip install -r requirements.txt
    echo -e "${GREEN}[OK] Zależności zainstalowane${NC}"
fi

# Uruchom aplikację
echo "[INFO] Uruchamianie aplikacji..."
echo ""
echo -e "${BLUE}========================================"
echo "  Dashboard dostępny pod:"
echo "  http://localhost:5000"
echo "========================================"
echo -e "${NC}"
echo "Aby zatrzymać aplikację, naciśnij Ctrl+C"
echo ""

python3 app.py
