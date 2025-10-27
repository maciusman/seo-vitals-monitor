from flask import Flask, render_template, request, redirect, url_for, jsonify
import database as db
from crawler import SEOCrawler
import threading
from datetime import datetime

app = Flask(__name__)

# Inicjalizacja bazy danych przy starcie
db.init_db()

# Przechowywanie aktywnych crawli
active_crawls = {}

@app.route('/')
def index():
    """Strona główna - lista domen"""
    domains = db.get_all_domains()

    # Dodaj statystyki dla każdej domeny
    for domain in domains:
        stats = db.get_domain_stats(domain['id'])
        domain['stats'] = stats
        domain['crawls_count'] = len(db.get_domain_crawls(domain['id'], limit=100))

    return render_template('index.html', domains=domains)

@app.route('/domain/<int:domain_id>')
def domain_detail(domain_id):
    """Szczegóły domeny"""
    domain = db.get_domain(domain_id)
    if not domain:
        return "Domena nie znaleziona", 404

    # Pobierz crawle
    crawls = db.get_domain_crawls(domain_id, limit=10)

    # Pobierz statystyki ostatniego crawla
    stats = db.get_domain_stats(domain_id)

    # Pobierz ostatnie zmiany
    if crawls:
        latest_changes = db.get_crawl_changes(crawls[0]['id'])
    else:
        latest_changes = []

    # Pobierz robots.txt
    robots = db.get_latest_robots_txt(domain_id)

    return render_template('domain.html',
                           domain=domain,
                           crawls=crawls,
                           stats=stats,
                           changes=latest_changes[:20],  # Ostatnie 20 zmian
                           robots=robots)

@app.route('/crawl/<int:crawl_id>')
def crawl_detail(crawl_id):
    """Szczegóły crawla"""
    # Pobierz informacje o crawlu
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT c.*, d.name as domain_name, d.url as domain_url
        FROM crawls c
        JOIN domains d ON c.domain_id = d.id
        WHERE c.id = ?
    ''', (crawl_id,))
    crawl = cursor.fetchone()
    conn.close()

    if not crawl:
        return "Crawl nie znaleziony", 404

    crawl = dict(crawl)

    # Pobierz strony
    pages = db.get_crawl_pages(crawl_id)

    # Pobierz zmiany
    changes = db.get_crawl_changes(crawl_id)

    # Statystyki
    total_pages = len(pages)
    status_stats = {
        '2xx': sum(1 for p in pages if p['status_code'] and 200 <= p['status_code'] < 300),
        '3xx': sum(1 for p in pages if p['status_code'] and 300 <= p['status_code'] < 400),
        '4xx': sum(1 for p in pages if p['status_code'] and 400 <= p['status_code'] < 500),
        '5xx': sum(1 for p in pages if p['status_code'] and p['status_code'] >= 500),
    }

    return render_template('crawl.html',
                           crawl=crawl,
                           pages=pages,
                           changes=changes,
                           total_pages=total_pages,
                           status_stats=status_stats)

@app.route('/add_domain', methods=['GET', 'POST'])
def add_domain():
    """Dodaj nową domenę"""
    if request.method == 'POST':
        name = request.form.get('name')
        url = request.form.get('url')

        if name and url:
            # Dodaj https:// jeśli brak
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url

            try:
                domain_id = db.add_domain(name, url)
                return redirect(url_for('domain_detail', domain_id=domain_id))
            except Exception as e:
                return render_template('add_domain.html', error=str(e))

    return render_template('add_domain.html')

@app.route('/delete_domain/<int:domain_id>', methods=['POST'])
def delete_domain(domain_id):
    """Usuń domenę"""
    db.delete_domain(domain_id)
    return redirect(url_for('index'))

@app.route('/start_crawl/<int:domain_id>', methods=['POST'])
def start_crawl(domain_id):
    """Rozpocznij crawling domeny"""
    domain = db.get_domain(domain_id)
    if not domain:
        return jsonify({'error': 'Domena nie znaleziona'}), 404

    # Sprawdź czy nie ma już aktywnego crawla
    if domain_id in active_crawls:
        return jsonify({'error': 'Crawl już w toku dla tej domeny'}), 400

    max_pages = request.form.get('max_pages', 100, type=int)

    # Uruchom crawl w tle
    def run_crawl():
        try:
            crawler = SEOCrawler(domain_id, domain['url'], max_pages=max_pages)
            result = crawler.crawl()
            active_crawls[domain_id] = result
        except Exception as e:
            print(f"Error podczas crawlingu: {e}")
        finally:
            if domain_id in active_crawls:
                del active_crawls[domain_id]

    thread = threading.Thread(target=run_crawl)
    thread.daemon = True
    thread.start()

    return jsonify({'status': 'started', 'message': 'Crawling rozpoczęty w tle'})

@app.route('/crawl_status/<int:domain_id>')
def crawl_status(domain_id):
    """Sprawdź status crawla"""
    if domain_id in active_crawls:
        return jsonify({'status': 'running', 'data': active_crawls[domain_id]})
    else:
        return jsonify({'status': 'idle'})

@app.template_filter('datetime')
def format_datetime(value):
    """Format datetime dla Jinja2"""
    if not value:
        return '-'
    try:
        if isinstance(value, str):
            dt = datetime.fromisoformat(value)
        else:
            dt = value
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except:
        return value

@app.template_filter('severity_badge')
def severity_badge(severity):
    """Badge dla severity"""
    colors = {
        'info': 'primary',
        'warning': 'warning',
        'critical': 'danger'
    }
    return colors.get(severity, 'secondary')

@app.template_filter('status_badge')
def status_badge(status_code):
    """Badge dla status code"""
    if not status_code:
        return 'secondary'
    if 200 <= status_code < 300:
        return 'success'
    elif 300 <= status_code < 400:
        return 'info'
    elif 400 <= status_code < 500:
        return 'warning'
    else:
        return 'danger'

if __name__ == '__main__':
    print("\n" + "="*60)
    print(" 🚀 SEO Vitals Monitor - Lokalna Aplikacja")
    print("="*60)
    print("\n📊 Dashboard dostępny pod adresem:")
    print("   http://localhost:5000")
    print("\n💡 Aby zatrzymać aplikację, naciśnij Ctrl+C")
    print("\n" + "="*60 + "\n")

    app.run(debug=True, host='0.0.0.0', port=5000)
