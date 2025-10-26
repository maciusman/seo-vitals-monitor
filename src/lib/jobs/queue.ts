import { Queue, QueueEvents } from 'bullmq';
import { createRedisConnection } from '@/lib/db/redis';

export interface CrawlJobData {
  domainId: string;
  baseUrl: string;
  maxDepth?: number;
  maxPages?: number;
  userAgent?: string;
}

// Create queue
export const crawlQueue = new Queue('crawl', {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
});

// Queue events for monitoring
export const crawlQueueEvents = new QueueEvents('crawl', {
  connection: createRedisConnection(),
});

/**
 * Add crawl job to queue
 */
export async function addCrawlJob(data: CrawlJobData, delay?: number) {
  const job = await crawlQueue.add('crawl-domain', data, {
    delay, // Delay in milliseconds
    jobId: `crawl-${data.domainId}-${Date.now()}`, // Unique job ID
  });

  console.log(`[Queue] Added crawl job ${job.id} for domain ${data.domainId}`);
  return job;
}

/**
 * Schedule recurring crawl for domain
 */
export async function scheduleRecurringCrawl(
  data: CrawlJobData,
  intervalDays: number = 2
) {
  const repeatOptions = {
    every: intervalDays * 24 * 60 * 60 * 1000, // Convert days to milliseconds
  };

  const job = await crawlQueue.add('crawl-domain', data, {
    repeat: repeatOptions,
    jobId: `recurring-${data.domainId}`, // Unique repeatable job ID
  });

  console.log(
    `[Queue] Scheduled recurring crawl for domain ${data.domainId} every ${intervalDays} days`
  );
  return job;
}

/**
 * Remove scheduled crawl for domain
 */
export async function removeScheduledCrawl(domainId: string) {
  const jobId = `recurring-${domainId}`;
  await crawlQueue.removeRepeatableByKey(jobId);
  console.log(`[Queue] Removed scheduled crawl for domain ${domainId}`);
}

/**
 * Get queue stats
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    crawlQueue.getWaitingCount(),
    crawlQueue.getActiveCount(),
    crawlQueue.getCompletedCount(),
    crawlQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
  };
}
