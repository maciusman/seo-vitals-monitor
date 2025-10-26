# Setup Guide

This guide will help you set up the SEO Vitals Monitor from scratch.

## Prerequisites

Before starting, make sure you have:

- **Node.js 20+** installed
- **PostgreSQL 16+** running
- **Redis 7+** running
- **Docker & Docker Compose** (optional, for containerized setup)

## Setup Steps

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd seo-vitals-monitor

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
nano .env  # or use your preferred editor
```

Required environment variables:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://user:password@localhost:5432/seo_vitals?schema=public"

# Redis - Update if not using defaults
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (for alerts) - Optional, but recommended
EMAIL_FROM="alerts@your-domain.com"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"

# Crawler
CRAWLER_USER_AGENT="SEO-Vitals-Monitor/1.0"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### 4. Start the Application

#### Development Mode

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start background worker
npm run worker
```

The app will be available at http://localhost:3000

#### Production Mode with Docker

```bash
# Start all services (PostgreSQL, Redis, App, Worker)
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy

# View logs
docker-compose logs -f
```

### 5. First Domain Setup

1. Open http://localhost:3000
2. Navigate to Dashboard
3. Click "Add Domain"
4. Fill in:
   - **Name**: My Website
   - **URL**: https://example.com
   - **Crawl Frequency**: 2 days
5. Click "Create Domain"

Your domain will be automatically scheduled for crawling!

## Testing

### Manual Crawl Test

```bash
# Trigger a test crawl via API
curl -X POST http://localhost:3000/api/crawl/trigger \
  -H "Content-Type: application/json" \
  -d '{"domainId": "your-domain-id"}'
```

### Check Worker Status

```bash
# If using Docker
docker-compose logs worker

# If running locally, check terminal 2
```

## Common Issues

### PostgreSQL Connection Error

**Error**: `Can't reach database server`

**Solution**:
- Ensure PostgreSQL is running
- Verify credentials in `.env`
- Test connection: `psql -h localhost -U your_user -d seo_vitals`

### Redis Connection Error

**Error**: `ECONNREFUSED 127.0.0.1:6379`

**Solution**:
- Start Redis: `redis-server`
- Or use Docker: `docker run -d -p 6379:6379 redis:7-alpine`

### Prisma Migration Errors

**Error**: Migration failed

**Solution**:
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or push schema without migrations
npx prisma db push
```

### Email Alerts Not Working

**Solution**:
- For Gmail, use App Password (not regular password)
- Enable "Less secure app access" or use OAuth2
- Check spam folder

## Email Configuration Examples

### Gmail

```env
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
```

Get App Password: https://myaccount.google.com/apppasswords

### SendGrid

```env
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT=587
EMAIL_USER="apikey"
EMAIL_PASSWORD="your-sendgrid-api-key"
```

### Mailgun

```env
EMAIL_HOST="smtp.mailgun.org"
EMAIL_PORT=587
EMAIL_USER="postmaster@your-domain.mailgun.org"
EMAIL_PASSWORD="your-mailgun-password"
```

## Production Deployment

### Docker Compose (Recommended)

```bash
# Production build
docker-compose -f docker-compose.yml up -d

# Scale workers if needed
docker-compose up -d --scale worker=3
```

### VPS / Traditional Server

```bash
# Install PM2
npm install -g pm2

# Build the app
npm run build

# Start with PM2
pm2 start npm --name "seo-vitals" -- start
pm2 start npm --name "seo-worker" -- run worker

# Save PM2 config
pm2 save
pm2 startup
```

### Vercel / Netlify

⚠️ Note: These platforms are great for the Next.js app, but you'll need to run the worker separately (e.g., on a VPS or Railway).

```bash
# Deploy app
vercel deploy

# Worker must run elsewhere
# Use Railway, Fly.io, or traditional VPS
```

## Health Checks

### Check App Status

```bash
# Health endpoint
curl http://localhost:3000/api/health

# List domains
curl http://localhost:3000/api/domains
```

### Check Queue Status

```bash
# Via Redis CLI
redis-cli
> KEYS bull:crawl:*
```

## Backup & Restore

### Database Backup

```bash
# Backup
pg_dump -h localhost -U seo_vitals -d seo_vitals > backup.sql

# Restore
psql -h localhost -U seo_vitals -d seo_vitals < backup.sql
```

### Docker Volumes Backup

```bash
# Backup PostgreSQL data
docker run --rm -v seo-vitals-monitor_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Restore
docker run --rm -v seo-vitals-monitor_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

## Next Steps

1. ✅ Add your first domain
2. ✅ Configure alerts
3. ✅ Set up email notifications
4. ✅ Monitor your first crawl
5. ✅ Explore the dashboard

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- Open an issue on GitHub
- Join our community discussions

Happy monitoring! 🚀
