import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
from typing import Set, Dict, List
import database as db

class SEOCrawler:
    def __init__(self, domain_id: int, base_url: str, max_pages: int = 100):
        self.domain_id = domain_id
        self.base_url = base_url.rstrip('/')
        self.domain = urlparse(base_url).netloc
        self.max_pages = max_pages
        self.visited_urls: Set[str] = set()
        self.to_visit: Set[str] = {base_url}
        self.crawl_id = None
        self.pages_data: List[Dict] = []
        self.errors: List[str] = []

    def crawl(self):
        """Główna funkcja crawlingu"""
        print(f"\n🚀 Rozpoczynam crawling: {self.base_url}")
        print(f"📊 Max stron: {self.max_pages}\n")

        # Utwórz crawl w bazie
        self.crawl_id = db.create_crawl(self.domain_id)

        # Sprawdź robots.txt
        robots_txt = self.fetch_robots_txt()
        if robots_txt:
            db.save_robots_txt(self.domain_id, robots_txt)

        # Crawluj strony
        while self.to_visit and len(self.visited_urls) < self.max_pages:
            url = self.to_visit.pop()

            if url in self.visited_urls:
                continue

            self.visited_urls.add(url)
            page_data = self.analyze_page(url)

            if page_data:
                self.pages_data.append(page_data)
                db.add_page(self.crawl_id, page_data)

                # Jeśli strona OK, dodaj linki
                if page_data.get('status_code') == 200 and page_data.get('links'):
                    for link in page_data['links']:
                        if link not in self.visited_urls:
                            self.to_visit.add(link)

            # Progress
            print(f"✓ Przeskanowano: {len(self.visited_urls)}/{self.max_pages} stron", end='\r')

            # Opóźnienie między requestami
            time.sleep(0.5)

        print(f"\n\n✅ Crawling zakończony!")
        print(f"📄 Znaleziono {len(self.pages_data)} stron")

        # Wykryj zmiany
        changes = self.detect_changes()

        # Oblicz health score
        health_score = self.calculate_health_score()

        # Zaktualizuj crawl w bazie
        errors_str = '\n'.join(self.errors) if self.errors else None
        db.update_crawl_status(
            self.crawl_id,
            'completed',
            len(self.pages_data),
            len(self.visited_urls),
            errors_str
        )

        # Zaktualizuj domenę
        db.update_domain_health(self.domain_id, health_score)

        print(f"💚 Health Score: {health_score}/100")
        if changes:
            print(f"⚠️  Wykryto {len(changes)} zmian!")

        return {
            'crawl_id': self.crawl_id,
            'pages_found': len(self.pages_data),
            'health_score': health_score,
            'changes': len(changes)
        }

    def fetch_robots_txt(self):
        """Pobiera robots.txt"""
        try:
            url = urljoin(self.base_url, '/robots.txt')
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                return response.text
        except:
            pass
        return None

    def analyze_page(self, url: str) -> Dict:
        """Analizuje pojedynczą stronę"""
        page_data = {
            'url': url,
            'status_code': None,
            'title': None,
            'meta_description': None,
            'h1': None,
            'canonical_url': None,
            'meta_robots': None,
            'has_noindex': 0,
            'has_nofollow': 0,
            'redirect_url': None,
            'response_time': 0,
            'error': None,
            'links': []
        }

        try:
            start_time = time.time()
            response = requests.get(
                url,
                timeout=30,
                allow_redirects=True,
                headers={'User-Agent': 'SEO-Vitals-Monitor/1.0'}
            )
            response_time = int((time.time() - start_time) * 1000)

            page_data['status_code'] = response.status_code
            page_data['response_time'] = response_time

            # Sprawdź redirect
            if response.history:
                page_data['redirect_url'] = response.url

            # Parsuj HTML tylko dla 200
            if response.status_code == 200 and 'text/html' in response.headers.get('Content-Type', ''):
                soup = BeautifulSoup(response.content, 'lxml')

                # Title
                if soup.title:
                    page_data['title'] = soup.title.string.strip() if soup.title.string else None

                # Meta description
                meta_desc = soup.find('meta', attrs={'name': 'description'})
                if meta_desc and meta_desc.get('content'):
                    page_data['meta_description'] = meta_desc['content'].strip()

                # H1
                h1 = soup.find('h1')
                if h1:
                    page_data['h1'] = h1.get_text().strip()

                # Canonical
                canonical = soup.find('link', attrs={'rel': 'canonical'})
                if canonical and canonical.get('href'):
                    page_data['canonical_url'] = canonical['href']

                # Meta robots
                meta_robots = soup.find('meta', attrs={'name': 'robots'})
                if meta_robots and meta_robots.get('content'):
                    robots_content = meta_robots['content'].lower()
                    page_data['meta_robots'] = robots_content
                    page_data['has_noindex'] = 1 if 'noindex' in robots_content else 0
                    page_data['has_nofollow'] = 1 if 'nofollow' in robots_content else 0

                # X-Robots-Tag header
                x_robots = response.headers.get('X-Robots-Tag', '').lower()
                if x_robots:
                    if 'noindex' in x_robots:
                        page_data['has_noindex'] = 1
                    if 'nofollow' in x_robots:
                        page_data['has_nofollow'] = 1

                # Zbierz linki wewnętrzne
                links = soup.find_all('a', href=True)
                for link in links:
                    href = link['href']
                    absolute_url = urljoin(url, href)

                    # Tylko linki wewnętrzne
                    if urlparse(absolute_url).netloc == self.domain:
                        # Usuń fragment i query
                        clean_url = absolute_url.split('#')[0].split('?')[0]
                        if clean_url and clean_url not in page_data['links']:
                            page_data['links'].append(clean_url)

        except requests.exceptions.Timeout:
            page_data['error'] = 'Timeout'
            self.errors.append(f"Timeout: {url}")
        except requests.exceptions.ConnectionError:
            page_data['error'] = 'Connection Error'
            self.errors.append(f"Connection Error: {url}")
        except Exception as e:
            page_data['error'] = str(e)
            self.errors.append(f"Error crawling {url}: {str(e)}")

        return page_data

    def detect_changes(self):
        """Wykrywa zmiany między crawlami"""
        # Pobierz poprzedni crawl
        crawls = db.get_domain_crawls(self.domain_id, limit=2)

        if len(crawls) < 2:
            return []  # Brak poprzedniego crawla

        previous_crawl_id = crawls[1]['id']
        current_pages = {p['url']: p for p in db.get_crawl_pages(self.crawl_id)}
        previous_pages = {p['url']: p for p in db.get_crawl_pages(previous_crawl_id)}

        changes = []

        # Sprawdź każdy URL
        for url, current in current_pages.items():
            if url not in previous_pages:
                # Nowa strona
                change = {
                    'url': url,
                    'change_type': 'NEW_PAGE',
                    'new_value': f"Status: {current['status_code']}",
                    'severity': 'info',
                    'description': 'Nowa strona wykryta'
                }
                changes.append(change)
                db.add_change(self.crawl_id, change)
            else:
                # Porównaj ze starą wersją
                previous = previous_pages[url]

                # Status code zmienił się
                if current['status_code'] != previous['status_code']:
                    severity = 'critical' if (previous['status_code'] == 200 and current['status_code'] >= 400) else 'warning'
                    change = {
                        'url': url,
                        'change_type': 'STATUS_CODE_CHANGED',
                        'old_value': str(previous['status_code']),
                        'new_value': str(current['status_code']),
                        'severity': severity,
                        'description': f"Kod odpowiedzi zmienił się z {previous['status_code']} na {current['status_code']}"
                    }
                    changes.append(change)
                    db.add_change(self.crawl_id, change)

                # Noindex dodany
                if current['has_noindex'] and not previous['has_noindex']:
                    change = {
                        'url': url,
                        'change_type': 'NOINDEX_ADDED',
                        'new_value': current['meta_robots'],
                        'severity': 'critical',
                        'description': 'Tag noindex został dodany'
                    }
                    changes.append(change)
                    db.add_change(self.crawl_id, change)

                # Noindex usunięty
                if not current['has_noindex'] and previous['has_noindex']:
                    change = {
                        'url': url,
                        'change_type': 'NOINDEX_REMOVED',
                        'old_value': previous['meta_robots'],
                        'severity': 'info',
                        'description': 'Tag noindex został usunięty'
                    }
                    changes.append(change)
                    db.add_change(self.crawl_id, change)

                # Title zmienił się
                if current['title'] != previous['title'] and (current['title'] or previous['title']):
                    change = {
                        'url': url,
                        'change_type': 'TITLE_CHANGED',
                        'old_value': previous['title'],
                        'new_value': current['title'],
                        'severity': 'info',
                        'description': 'Tytuł strony zmienił się'
                    }
                    changes.append(change)
                    db.add_change(self.crawl_id, change)

        # Sprawdź usunięte strony
        for url in previous_pages:
            if url not in current_pages:
                change = {
                    'url': url,
                    'change_type': 'PAGE_REMOVED',
                    'old_value': f"Status: {previous_pages[url]['status_code']}",
                    'severity': 'warning',
                    'description': 'Strona nie została znaleziona w tym crawlu'
                }
                changes.append(change)
                db.add_change(self.crawl_id, change)

        return changes

    def calculate_health_score(self):
        """Oblicza health score (0-100)"""
        if not self.pages_data:
            return 0

        score = 100
        total_pages = len(self.pages_data)

        # Kary za błędy
        status_4xx = sum(1 for p in self.pages_data if p['status_code'] and 400 <= p['status_code'] < 500)
        status_5xx = sum(1 for p in self.pages_data if p['status_code'] and p['status_code'] >= 500)
        noindex_pages = sum(1 for p in self.pages_data if p['has_noindex'])
        errors = sum(1 for p in self.pages_data if p['error'])

        # Odejmij punkty
        score -= min(status_4xx * 2, 30)  # Max -30 za 4xx
        score -= min(status_5xx * 5, 40)  # Max -40 za 5xx
        score -= min(noindex_pages * 3, 20)  # Max -20 za noindex
        score -= min(errors * 2, 10)  # Max -10 za błędy

        return max(0, score)
