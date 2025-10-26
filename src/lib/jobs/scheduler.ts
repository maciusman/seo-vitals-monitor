import { prisma } from '@/lib/db/prisma';
import { scheduleRecurringCrawl, removeScheduledCrawl } from './queue';

/**
 * Schedule crawls for all active domains
 */
export async function scheduleAllDomains() {
  const domains = await prisma.domain.findMany({
    where: { active: true },
  });

  console.log(`[Scheduler] Scheduling ${domains.length} active domains`);

  for (const domain of domains) {
    try {
      await scheduleRecurringCrawl(
        {
          domainId: domain.id,
          baseUrl: domain.url,
          maxDepth: domain.maxDepth,
          maxPages: domain.maxPages,
          userAgent: domain.userAgent || undefined,
        },
        domain.crawlFrequency
      );

      console.log(
        `[Scheduler] Scheduled domain ${domain.name} (every ${domain.crawlFrequency} days)`
      );
    } catch (error: any) {
      console.error(`[Scheduler] Error scheduling domain ${domain.id}:`, error.message);
    }
  }
}

/**
 * Reschedule domain crawl
 */
export async function rescheduleDomain(domainId: string) {
  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
  });

  if (!domain) {
    throw new Error(`Domain ${domainId} not found`);
  }

  // Remove existing schedule
  await removeScheduledCrawl(domainId);

  // Add new schedule if active
  if (domain.active) {
    await scheduleRecurringCrawl(
      {
        domainId: domain.id,
        baseUrl: domain.url,
        maxDepth: domain.maxDepth,
        maxPages: domain.maxPages,
        userAgent: domain.userAgent || undefined,
      },
      domain.crawlFrequency
    );
  }

  console.log(`[Scheduler] Rescheduled domain ${domain.name}`);
}

/**
 * Initialize scheduler - run on app startup
 */
export async function initializeScheduler() {
  console.log('[Scheduler] Initializing scheduler...');
  await scheduleAllDomains();
  console.log('[Scheduler] Scheduler initialized');
}
