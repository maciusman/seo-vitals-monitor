# SEO Vitals Monitor 🚀

Comprehensive, production-ready SEO monitoring dashboard that automatically crawls your domains, detects critical changes, and alerts you to potential issues.

## Features ✨

### Core Monitoring
- **Automatic Crawling**: Scheduled crawls every 2 days (configurable)
- **Comprehensive Analysis**:
  - HTTP status codes (200, 301, 302, 404, 500, etc.)
  - Meta robots & X-Robots-Tag detection
  - Robots.txt monitoring
  - Redirect chain detection
  - Response time tracking
  - Content change detection

### Change Detection
- **Status Code Changes**: 200→404, 200→301, etc.
- **SEO Critical Changes**:
  - Noindex/nofollow tag additions
  - Canonical URL changes
  - Title & meta description changes
  - Robots.txt modifications
- **New/Removed Pages**: Automatic discovery
- **Historical Tracking**: Full audit trail

### Alert System
- **Predefined Alerts**: Critical SEO issues
- **Custom Rules**: Build your own alert conditions
- **Multiple Channels**: Email, webhooks
- **Severity Levels**: Info, Warning, Critical

### Dashboard
- **Domain Overview**: Health scores, status badges
- **Detailed Metrics**: All page statuses, SEO issues
- **Charts & Visualizations**: Trends over time
- **Change History**: Timeline of all changes

## Tech Stack 🛠

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: BullMQ with Redis
- **Crawler**: Axios, Cheerio, Sitemapper
- **Alerts**: Nodemailer (email), Webhooks

## Quick Start 🚀

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (optional)

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd seo-vitals-monitor

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec app npx prisma migrate dev

# Access the dashboard
open http://localhost:3000
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
npx prisma migrate dev
npx prisma generate

# Start PostgreSQL and Redis locally
# (or use existing instances)

# Start development server
npm run dev

# In another terminal, start the worker
npm run worker

# Access the dashboard
open http://localhost:3000
```

## Configuration ⚙️

### Environment Variables

Create a `.env` file with the following:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/seo_vitals?schema=public"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (for alerts)
EMAIL_FROM="alerts@your-domain.com"
EMAIL_HOST="smtp.your-provider.com"
EMAIL_PORT=587
EMAIL_USER="your-email@example.com"
EMAIL_PASSWORD="your-password"

# Crawler Settings
CRAWLER_USER_AGENT="SEO-Vitals-Monitor/1.0 (+https://your-domain.com/bot)"
CRAWLER_MAX_CONCURRENT=5
CRAWLER_REQUEST_TIMEOUT=30000
```

## Usage Guide 📖

### Adding a Domain

1. Navigate to the Dashboard
2. Click "Add Domain"
3. Fill in:
   - **Domain Name**: Friendly name
   - **URL**: Full URL (https://example.com)
   - **Crawl Frequency**: Days between crawls (default: 2)
   - **Max Depth**: How deep to crawl (default: 5)
   - **Max Pages**: Maximum pages to crawl (default: 1000)
4. Click "Create Domain"

### Triggering a Manual Crawl

- From the dashboard, click the refresh icon on any domain card
- Or use the API: `POST /api/crawl/trigger` with `{ "domainId": "..." }`

### Setting Up Alerts

1. Navigate to Alerts
2. Click "Create Alert"
3. Choose alert type:
   - **Predefined**: Noindex added, page down, redirect changes
   - **Custom**: Build your own rules
4. Configure notification channels:
   - Email recipients
   - Webhook URLs
5. Save and enable

### Viewing Results

- **Domain Dashboard**: See overall health and recent changes
- **Crawl History**: View all past crawls and compare
- **Pages View**: Filter by status code, issues
- **Changes Timeline**: See what changed and when

## API Endpoints 🔌

### Domains

```
GET    /api/domains           - List all domains
POST   /api/domains           - Create domain
GET    /api/domains/:id       - Get domain details
PATCH  /api/domains/:id       - Update domain
DELETE /api/domains/:id       - Delete domain
GET    /api/domains/:id/stats - Get domain statistics
```

### Crawls

```
POST /api/crawl/trigger       - Trigger manual crawl
GET  /api/crawl/:id           - Get crawl details
GET  /api/crawl/:id/pages     - Get crawled pages
GET  /api/crawl/:id/changes   - Get detected changes
```

### Alerts

```
GET    /api/alerts            - List alerts
POST   /api/alerts            - Create alert
GET    /api/alerts/:id        - Get alert details
PATCH  /api/alerts/:id        - Update alert
DELETE /api/alerts/:id        - Delete alert
```

## Architecture 🏗

### Components

```
┌─────────────────────────────────────────────────────┐
│                   Next.js App                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Dashboard   │  │   API Routes │  │  Worker   │ │
│  │   (React)    │  │              │  │  (BullMQ) │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
           │                  │                │
           ├──────────────────┼────────────────┤
           │                  │                │
    ┌──────▼──────┐    ┌─────▼─────┐   ┌─────▼─────┐
    │ PostgreSQL  │    │   Redis   │   │  Crawler  │
    │  (Prisma)   │    │  (Queue)  │   │  Engine   │
    └─────────────┘    └───────────┘   └───────────┘
```

### Crawler Flow

1. **Schedule**: BullMQ schedules crawl jobs every N days
2. **Discovery**: Fetch sitemap.xml, parse robots.txt
3. **Crawl**: Visit each URL, analyze content
4. **Store**: Save snapshots to database
5. **Compare**: Detect changes vs previous crawl
6. **Alert**: Trigger alerts for critical changes
7. **Update**: Calculate health score, update status

## Database Schema 🗄

Key models:

- **Domain**: Monitored domains
- **CrawlJob**: Individual crawl instances
- **PageSnapshot**: Per-page data from each crawl
- **ChangeDetection**: Detected changes between crawls
- **Alert**: Alert configurations
- **TriggeredAlert**: Alert instances
- **RobotsTxt**: Historical robots.txt tracking

See `prisma/schema.prisma` for full schema.

## Alert Rule Examples 📢

### Noindex Added
```json
{
  "rules": [
    {
      "type": "change_type",
      "condition": { "types": ["NOINDEX_ADDED"] }
    }
  ]
}
```

### Page Down (200 → 4xx/5xx)
```json
{
  "rules": [
    {
      "type": "status_code_change",
      "condition": {
        "from": [200],
        "to": [400, 401, 403, 404, 500, 502, 503]
      }
    }
  ]
}
```

### Critical Changes
```json
{
  "rules": [
    {
      "type": "severity",
      "condition": { "levels": ["CRITICAL"] }
    }
  ]
}
```

## Performance 🚄

- **Concurrent Crawling**: 5 pages simultaneously (configurable)
- **Batch Processing**: Efficient database operations
- **Caching**: Redis for queue management
- **Optimized Queries**: Prisma with proper indexes

## Monitoring & Logs 📊

- **Application Logs**: Console output from Next.js
- **Worker Logs**: Background job processing
- **Queue Metrics**: BullMQ dashboard integration available
- **Database Queries**: Enable Prisma logging in dev

## Deployment 🚢

### Docker Production

```bash
# Build and deploy
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f app worker

# Scale workers
docker-compose up -d --scale worker=3
```

### Vercel / Railway / Fly.io

1. Connect your Git repository
2. Set environment variables
3. Deploy app
4. Deploy worker separately (if supported)

### Traditional VPS

```bash
# Install dependencies
npm ci --production

# Build
npm run build

# Run migrations
npx prisma migrate deploy

# Start with PM2
pm2 start npm --name "seo-vitals-app" -- start
pm2 start npm --name "seo-vitals-worker" -- run worker
```

## Troubleshooting 🔧

### Database Connection Issues
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check network connectivity

### Redis Connection Issues
- Verify REDIS_HOST and REDIS_PORT
- Ensure Redis is running
- Check if password is required

### Crawling Errors
- Check robots.txt allows your user agent
- Verify target site is accessible
- Increase request timeout if needed

### Email Alerts Not Sending
- Verify SMTP credentials
- Check spam folder
- Test with simple SMTP tool first

## Contributing 🤝

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License 📄

MIT License - See LICENSE file for details

## Support 💬

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@your-domain.com

## Roadmap 🗺

- [ ] Lighthouse integration
- [ ] Core Web Vitals monitoring
- [ ] JavaScript rendering support
- [ ] Multi-language support
- [ ] Advanced reporting & exports
- [ ] Slack/Discord integrations
- [ ] Mobile app

---

**Built with ❤️ for SEO professionals**
