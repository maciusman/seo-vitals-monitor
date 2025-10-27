import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'seo_monitor.db')

def init_db():
    """Inicjalizacja bazy danych SQLite"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Tabela domen
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS domains (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT NOT NULL UNIQUE,
            active INTEGER DEFAULT 1,
            last_crawled TIMESTAMP,
            health_score INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Tabela crawli
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS crawls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domain_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            pages_found INTEGER DEFAULT 0,
            pages_crawled INTEGER DEFAULT 0,
            errors TEXT,
            FOREIGN KEY (domain_id) REFERENCES domains (id) ON DELETE CASCADE
        )
    ''')

    # Tabela stron
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            crawl_id INTEGER NOT NULL,
            url TEXT NOT NULL,
            status_code INTEGER,
            title TEXT,
            meta_description TEXT,
            h1 TEXT,
            canonical_url TEXT,
            meta_robots TEXT,
            has_noindex INTEGER DEFAULT 0,
            has_nofollow INTEGER DEFAULT 0,
            redirect_url TEXT,
            response_time INTEGER,
            error TEXT,
            crawled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (crawl_id) REFERENCES crawls (id) ON DELETE CASCADE
        )
    ''')

    # Tabela zmian
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS changes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            crawl_id INTEGER NOT NULL,
            url TEXT NOT NULL,
            change_type TEXT NOT NULL,
            old_value TEXT,
            new_value TEXT,
            severity TEXT DEFAULT 'info',
            description TEXT,
            detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (crawl_id) REFERENCES crawls (id) ON DELETE CASCADE
        )
    ''')

    # Tabela robots.txt
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS robots_txt (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domain_id INTEGER NOT NULL,
            content TEXT,
            checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (domain_id) REFERENCES domains (id) ON DELETE CASCADE
        )
    ''')

    conn.commit()
    conn.close()

def get_connection():
    """Zwraca połączenie do bazy danych"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# CRUD dla domen
def add_domain(name: str, url: str):
    """Dodaje nową domenę"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO domains (name, url) VALUES (?, ?)', (name, url))
    conn.commit()
    domain_id = cursor.lastrowid
    conn.close()
    return domain_id

def get_all_domains():
    """Zwraca wszystkie domeny"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM domains ORDER BY created_at DESC')
    domains = cursor.fetchall()
    conn.close()
    return [dict(d) for d in domains]

def get_domain(domain_id: int):
    """Zwraca domenę po ID"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM domains WHERE id = ?', (domain_id,))
    domain = cursor.fetchone()
    conn.close()
    return dict(domain) if domain else None

def update_domain_health(domain_id: int, health_score: int):
    """Aktualizuje health score domeny"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE domains
        SET health_score = ?, last_crawled = ?
        WHERE id = ?
    ''', (health_score, datetime.now(), domain_id))
    conn.commit()
    conn.close()

def delete_domain(domain_id: int):
    """Usuwa domenę"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM domains WHERE id = ?', (domain_id,))
    conn.commit()
    conn.close()

# CRUD dla crawli
def create_crawl(domain_id: int):
    """Tworzy nowy crawl"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO crawls (domain_id, status) VALUES (?, ?)',
                   (domain_id, 'running'))
    crawl_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return crawl_id

def update_crawl_status(crawl_id: int, status: str, pages_found: int = 0, pages_crawled: int = 0, errors: str = None):
    """Aktualizuje status crawla"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE crawls
        SET status = ?, pages_found = ?, pages_crawled = ?, completed_at = ?, errors = ?
        WHERE id = ?
    ''', (status, pages_found, pages_crawled, datetime.now(), errors, crawl_id))
    conn.commit()
    conn.close()

def get_domain_crawls(domain_id: int, limit: int = 10):
    """Zwraca crawle dla domeny"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM crawls
        WHERE domain_id = ?
        ORDER BY started_at DESC
        LIMIT ?
    ''', (domain_id, limit))
    crawls = cursor.fetchall()
    conn.close()
    return [dict(c) for c in crawls]

# CRUD dla stron
def add_page(crawl_id: int, page_data: Dict):
    """Dodaje stronę do bazy"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO pages (
            crawl_id, url, status_code, title, meta_description, h1,
            canonical_url, meta_robots, has_noindex, has_nofollow,
            redirect_url, response_time, error
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        crawl_id,
        page_data.get('url'),
        page_data.get('status_code'),
        page_data.get('title'),
        page_data.get('meta_description'),
        page_data.get('h1'),
        page_data.get('canonical_url'),
        page_data.get('meta_robots'),
        page_data.get('has_noindex', 0),
        page_data.get('has_nofollow', 0),
        page_data.get('redirect_url'),
        page_data.get('response_time'),
        page_data.get('error')
    ))
    conn.commit()
    conn.close()

def get_crawl_pages(crawl_id: int):
    """Zwraca wszystkie strony z crawla"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM pages WHERE crawl_id = ? ORDER BY url', (crawl_id,))
    pages = cursor.fetchall()
    conn.close()
    return [dict(p) for p in pages]

# CRUD dla zmian
def add_change(crawl_id: int, change_data: Dict):
    """Dodaje wykrytą zmianę"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO changes (
            crawl_id, url, change_type, old_value, new_value, severity, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        crawl_id,
        change_data.get('url'),
        change_data.get('change_type'),
        change_data.get('old_value'),
        change_data.get('new_value'),
        change_data.get('severity', 'info'),
        change_data.get('description')
    ))
    conn.commit()
    conn.close()

def get_crawl_changes(crawl_id: int):
    """Zwraca wszystkie zmiany z crawla"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM changes
        WHERE crawl_id = ?
        ORDER BY severity DESC, detected_at DESC
    ''', (crawl_id,))
    changes = cursor.fetchall()
    conn.close()
    return [dict(c) for c in changes]

def get_domain_stats(domain_id: int):
    """Zwraca statystyki domeny z ostatniego crawla"""
    conn = get_connection()
    cursor = conn.cursor()

    # Ostatni crawl
    cursor.execute('''
        SELECT id FROM crawls
        WHERE domain_id = ? AND status = 'completed'
        ORDER BY completed_at DESC
        LIMIT 1
    ''', (domain_id,))

    crawl = cursor.fetchone()
    if not crawl:
        conn.close()
        return None

    crawl_id = crawl['id']

    # Statystyki stron
    cursor.execute('''
        SELECT
            COUNT(*) as total_pages,
            SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as status_2xx,
            SUM(CASE WHEN status_code >= 300 AND status_code < 400 THEN 1 ELSE 0 END) as status_3xx,
            SUM(CASE WHEN status_code >= 400 AND status_code < 500 THEN 1 ELSE 0 END) as status_4xx,
            SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as status_5xx,
            SUM(has_noindex) as noindex_pages,
            SUM(has_nofollow) as nofollow_pages,
            SUM(CASE WHEN redirect_url IS NOT NULL THEN 1 ELSE 0 END) as redirects,
            SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as errors,
            AVG(response_time) as avg_response_time
        FROM pages
        WHERE crawl_id = ?
    ''', (crawl_id,))

    stats = dict(cursor.fetchone())

    # Zmiany
    cursor.execute('''
        SELECT
            COUNT(*) as total_changes,
            SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_changes,
            SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning_changes
        FROM changes
        WHERE crawl_id = ?
    ''', (crawl_id,))

    changes_stats = dict(cursor.fetchone())
    stats.update(changes_stats)

    conn.close()
    return stats

# Robots.txt
def save_robots_txt(domain_id: int, content: str):
    """Zapisuje robots.txt"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO robots_txt (domain_id, content)
        VALUES (?, ?)
    ''', (domain_id, content))
    conn.commit()
    conn.close()

def get_latest_robots_txt(domain_id: int):
    """Zwraca ostatni robots.txt"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM robots_txt
        WHERE domain_id = ?
        ORDER BY checked_at DESC
        LIMIT 1
    ''', (domain_id,))
    robots = cursor.fetchone()
    conn.close()
    return dict(robots) if robots else None
