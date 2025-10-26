import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '@/lib/db/redis';
import { WebCrawler } from '@/lib/crawler/core';
import { detectChanges } from '@/lib/crawler/change-detector';
import { processAlerts } from '@/lib/alerts/engine';
import { CrawlJobData } from './queue';
import { prisma } from '@/lib/db/prisma';
import { DomainStatus } from '@prisma/client';

/**
 * Process crawl job
 */
async function processCrawlJob(job: Job<CrawlJobData>) {
  const { domainId, baseUrl, maxDepth, maxPages, userAgent } = job.data;

  console.log(`[Worker] Processing crawl job ${job.id} for domain ${domainId}`);

  try {
    // Get domain config
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      throw new Error(`Domain ${domainId} not found`);
    }

    if (!domain.active) {
      console.log(`[Worker] Domain ${domainId} is inactive, skipping crawl`);
      return;
    }

    // Create crawler
    const crawler = new WebCrawler({
      domainId,
      baseUrl: baseUrl || domain.url,
      maxDepth: maxDepth || domain.maxDepth,
      maxPages: maxPages || domain.maxPages,
      userAgent: userAgent || domain.userAgent || undefined,
      followRobotsTxt: domain.followRobotsTxt,
    });

    // Start crawl
    const crawlJobId = await crawler.crawl();

    // Detect changes
    console.log(`[Worker] Detecting changes for crawl ${crawlJobId}`);
    const changes = await detectChanges(crawlJobId, domainId);

    // Process alerts
    if (changes.length > 0) {
      console.log(`[Worker] Processing alerts for ${changes.length} changes`);
      await processAlerts(domainId, crawlJobId, changes);
    }

    // Update domain health score and status
    await updateDomainHealth(domainId, crawlJobId);

    console.log(`[Worker] Completed crawl job ${job.id} successfully`);

    return {
      crawlJobId,
      changesDetected: changes.length,
    };
  } catch (error: any) {
    console.error(`[Worker] Error processing crawl job ${job.id}:`, error);

    // Update domain status to ERROR
    await prisma.domain.update({
      where: { id: domainId },
      data: {
        lastStatus: DomainStatus.CRITICAL,
      },
    });

    throw error;
  }
}

/**
 * Update domain health score based on latest crawl
 */
async function updateDomainHealth(domainId: string, crawlJobId: string) {
  const crawlJob = await prisma.crawlJob.findUnique({
    where: { id: crawlJobId },
    include: {
      snapshots: true,
      changes: true,
    },
  });

  if (!crawlJob) return;

  const snapshots = crawlJob.snapshots;
  const changes = crawlJob.changes;

  // Calculate health score (0-100)
  let healthScore = 100;
  let status = DomainStatus.HEALTHY;

  // Deduct points for issues
  const total4xx = snapshots.filter((s) => s.statusCode >= 400 && s.statusCode < 500).length;
  const total5xx = snapshots.filter((s) => s.statusCode >= 500).length;
  const totalNoindex = snapshots.filter((s) => s.hasNoindex).length;
  const totalErrors = snapshots.filter((s) => s.error).length;
  const criticalChanges = changes.filter((c) => c.severity === 'CRITICAL').length;

  // Penalties
  healthScore -= Math.min(total4xx * 2, 30); // Max -30 for 4xx errors
  healthScore -= Math.min(total5xx * 5, 40); // Max -40 for 5xx errors
  healthScore -= Math.min(totalNoindex * 3, 20); // Max -20 for noindex
  healthScore -= Math.min(totalErrors * 2, 10); // Max -10 for errors
  healthScore -= Math.min(criticalChanges * 5, 20); // Max -20 for critical changes

  healthScore = Math.max(0, healthScore);

  // Determine status
  if (total5xx > 0 || criticalChanges > 5) {
    status = DomainStatus.CRITICAL;
  } else if (total4xx > 10 || totalNoindex > 5 || healthScore < 70) {
    status = DomainStatus.WARNING;
  } else if (healthScore >= 90) {
    status = DomainStatus.HEALTHY;
  } else {
    status = DomainStatus.WARNING;
  }

  // Update domain
  await prisma.domain.update({
    where: { id: domainId },
    data: {
      healthScore,
      lastStatus: status,
    },
  });

  console.log(`[Worker] Updated domain ${domainId} health: ${healthScore} (${status})`);
}

/**
 * Create and start worker
 */
export function createCrawlWorker() {
  const worker = new Worker('crawl', processCrawlJob, {
    connection: createRedisConnection(),
    concurrency: 2, // Process 2 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // Per minute
    },
  });

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err);
  });

  console.log('[Worker] Crawl worker started');

  return worker;
}

// Start worker if this file is run directly
if (require.main === module) {
  console.log('[Worker] Starting crawl worker...');
  createCrawlWorker();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[Worker] SIGTERM received, shutting down...');
    process.exit(0);
  });
}
