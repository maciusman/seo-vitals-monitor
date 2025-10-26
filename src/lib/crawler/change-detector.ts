import { prisma } from '@/lib/db/prisma';
import { ChangeType, Severity, PageSnapshot } from '@prisma/client';

export interface DetectedChange {
  url: string;
  changeType: ChangeType;
  oldValue?: string;
  newValue?: string;
  severity: Severity;
  description?: string;
}

/**
 * Detect changes between two crawls
 */
export async function detectChanges(
  currentCrawlJobId: string,
  domainId: string
): Promise<DetectedChange[]> {
  const changes: DetectedChange[] = [];

  // Get previous crawl
  const previousCrawl = await prisma.crawlJob.findFirst({
    where: {
      domainId,
      status: 'COMPLETED',
      id: { not: currentCrawlJobId },
    },
    orderBy: {
      completedAt: 'desc',
    },
    include: {
      snapshots: true,
    },
  });

  if (!previousCrawl) {
    console.log('[ChangeDetector] No previous crawl found - skipping change detection');
    return changes;
  }

  // Get current crawl snapshots
  const currentSnapshots = await prisma.pageSnapshot.findMany({
    where: { crawlJobId: currentCrawlJobId },
  });

  console.log(
    `[ChangeDetector] Comparing ${currentSnapshots.length} current pages with ${previousCrawl.snapshots.length} previous pages`
  );

  // Create maps for easy lookup
  const previousMap = new Map(
    previousCrawl.snapshots.map((s) => [s.normalizedUrl, s])
  );
  const currentMap = new Map(
    currentSnapshots.map((s) => [s.normalizedUrl, s])
  );

  // Check for new, removed, and changed pages
  for (const [url, currentSnapshot] of currentMap) {
    const previousSnapshot = previousMap.get(url);

    if (!previousSnapshot) {
      // New page
      changes.push({
        url,
        changeType: ChangeType.NEW_PAGE,
        newValue: `Status: ${currentSnapshot.statusCode}`,
        severity: Severity.INFO,
        description: `New page discovered`,
      });
    } else {
      // Compare for changes
      const pageChanges = compareSnapshots(previousSnapshot, currentSnapshot);
      changes.push(...pageChanges);
    }
  }

  // Check for removed pages
  for (const [url, previousSnapshot] of previousMap) {
    if (!currentMap.has(url)) {
      changes.push({
        url,
        changeType: ChangeType.REMOVED_PAGE,
        oldValue: `Status: ${previousSnapshot.statusCode}`,
        severity: Severity.WARNING,
        description: `Page no longer found in crawl`,
      });
    }
  }

  // Save changes to database
  if (changes.length > 0) {
    await prisma.changeDetection.createMany({
      data: changes.map((change) => ({
        crawlJobId: currentCrawlJobId,
        url: change.url,
        changeType: change.changeType,
        oldValue: change.oldValue,
        newValue: change.newValue,
        severity: change.severity,
        description: change.description,
      })),
    });
  }

  // Update crawl job statistics
  await prisma.crawlJob.update({
    where: { id: currentCrawlJobId },
    data: {
      pagesNew: changes.filter((c) => c.changeType === ChangeType.NEW_PAGE).length,
      pagesChanged: changes.filter(
        (c) => c.changeType !== ChangeType.NEW_PAGE && c.changeType !== ChangeType.REMOVED_PAGE
      ).length,
      pagesRemoved: changes.filter((c) => c.changeType === ChangeType.REMOVED_PAGE).length,
    },
  });

  console.log(`[ChangeDetector] Detected ${changes.length} changes`);

  return changes;
}

/**
 * Compare two snapshots and detect changes
 */
function compareSnapshots(
  previous: PageSnapshot,
  current: PageSnapshot
): DetectedChange[] {
  const changes: DetectedChange[] = [];
  const url = current.url;

  // Status code changed
  if (previous.statusCode !== current.statusCode) {
    const severity = determineSeverityForStatusChange(
      previous.statusCode,
      current.statusCode
    );

    changes.push({
      url,
      changeType: ChangeType.STATUS_CODE_CHANGED,
      oldValue: previous.statusCode.toString(),
      newValue: current.statusCode.toString(),
      severity,
      description: `Status code changed from ${previous.statusCode} to ${current.statusCode}`,
    });
  }

  // Noindex added
  if (!previous.hasNoindex && current.hasNoindex) {
    changes.push({
      url,
      changeType: ChangeType.NOINDEX_ADDED,
      newValue: current.metaRobots || current.xRobotsTag || 'noindex',
      severity: Severity.CRITICAL,
      description: `Noindex tag added to page`,
    });
  }

  // Noindex removed
  if (previous.hasNoindex && !current.hasNoindex) {
    changes.push({
      url,
      changeType: ChangeType.NOINDEX_REMOVED,
      oldValue: previous.metaRobots || previous.xRobotsTag || 'noindex',
      severity: Severity.INFO,
      description: `Noindex tag removed from page`,
    });
  }

  // Nofollow added
  if (!previous.hasNofollow && current.hasNofollow) {
    changes.push({
      url,
      changeType: ChangeType.NOFOLLOW_ADDED,
      newValue: current.metaRobots || current.xRobotsTag || 'nofollow',
      severity: Severity.WARNING,
      description: `Nofollow tag added to page`,
    });
  }

  // Nofollow removed
  if (previous.hasNofollow && !current.hasNofollow) {
    changes.push({
      url,
      changeType: ChangeType.NOFOLLOW_REMOVED,
      oldValue: previous.metaRobots || previous.xRobotsTag || 'nofollow',
      severity: Severity.INFO,
      description: `Nofollow tag removed from page`,
    });
  }

  // Redirect added
  if (!previous.redirectUrl && current.redirectUrl) {
    changes.push({
      url,
      changeType: ChangeType.REDIRECT_ADDED,
      newValue: current.redirectUrl,
      severity: Severity.WARNING,
      description: `Redirect added to ${current.redirectUrl}`,
    });
  }

  // Redirect removed
  if (previous.redirectUrl && !current.redirectUrl) {
    changes.push({
      url,
      changeType: ChangeType.REDIRECT_REMOVED,
      oldValue: previous.redirectUrl,
      severity: Severity.INFO,
      description: `Redirect removed`,
    });
  }

  // Redirect changed
  if (
    previous.redirectUrl &&
    current.redirectUrl &&
    previous.redirectUrl !== current.redirectUrl
  ) {
    changes.push({
      url,
      changeType: ChangeType.REDIRECT_CHANGED,
      oldValue: previous.redirectUrl,
      newValue: current.redirectUrl,
      severity: Severity.WARNING,
      description: `Redirect changed from ${previous.redirectUrl} to ${current.redirectUrl}`,
    });
  }

  // Title changed
  if (previous.title !== current.title && (previous.title || current.title)) {
    changes.push({
      url,
      changeType: ChangeType.TITLE_CHANGED,
      oldValue: previous.title || '(empty)',
      newValue: current.title || '(empty)',
      severity: Severity.INFO,
      description: `Title changed`,
    });
  }

  // Meta description changed
  if (
    previous.metaDescription !== current.metaDescription &&
    (previous.metaDescription || current.metaDescription)
  ) {
    changes.push({
      url,
      changeType: ChangeType.META_DESCRIPTION_CHANGED,
      oldValue: previous.metaDescription || '(empty)',
      newValue: current.metaDescription || '(empty)',
      severity: Severity.INFO,
      description: `Meta description changed`,
    });
  }

  // Canonical changed
  if (
    previous.canonicalUrl !== current.canonicalUrl &&
    (previous.canonicalUrl || current.canonicalUrl)
  ) {
    changes.push({
      url,
      changeType: ChangeType.CANONICAL_CHANGED,
      oldValue: previous.canonicalUrl || '(none)',
      newValue: current.canonicalUrl || '(none)',
      severity: Severity.WARNING,
      description: `Canonical URL changed`,
    });
  }

  // Content changed (significant)
  if (previous.contentHash !== current.contentHash) {
    changes.push({
      url,
      changeType: ChangeType.CONTENT_CHANGED,
      severity: Severity.INFO,
      description: `Page content changed`,
    });
  }

  // Error detected
  if (!previous.error && current.error) {
    changes.push({
      url,
      changeType: ChangeType.ERROR_DETECTED,
      newValue: current.error,
      severity: Severity.CRITICAL,
      description: `Error detected: ${current.error}`,
    });
  }

  // Error resolved
  if (previous.error && !current.error) {
    changes.push({
      url,
      changeType: ChangeType.ERROR_RESOLVED,
      oldValue: previous.error,
      severity: Severity.INFO,
      description: `Error resolved`,
    });
  }

  // Slow response (> 3 seconds)
  if (current.responseTime > 3000 && previous.responseTime <= 3000) {
    changes.push({
      url,
      changeType: ChangeType.SLOW_RESPONSE,
      newValue: `${current.responseTime}ms`,
      severity: Severity.WARNING,
      description: `Page response time increased to ${current.responseTime}ms`,
    });
  }

  return changes;
}

/**
 * Determine severity for status code changes
 */
function determineSeverityForStatusChange(
  oldStatus: number,
  newStatus: number
): Severity {
  // From 2xx to 4xx/5xx - CRITICAL
  if (oldStatus >= 200 && oldStatus < 300 && (newStatus >= 400 || newStatus < 200)) {
    return Severity.CRITICAL;
  }

  // From 2xx to 3xx - WARNING
  if (oldStatus >= 200 && oldStatus < 300 && newStatus >= 300 && newStatus < 400) {
    return Severity.WARNING;
  }

  // From 4xx/5xx to 2xx - INFO (recovery)
  if ((oldStatus >= 400 || oldStatus < 200) && newStatus >= 200 && newStatus < 300) {
    return Severity.INFO;
  }

  // Default
  return Severity.WARNING;
}

/**
 * Check robots.txt changes
 */
export async function detectRobotsTxtChanges(
  domainId: string,
  currentContent: string,
  currentHash: string
): Promise<boolean> {
  const previousRobotsTxt = await prisma.robotsTxt.findFirst({
    where: { domainId },
    orderBy: { createdAt: 'desc' },
    skip: 1, // Skip current (just created)
  });

  if (!previousRobotsTxt) {
    return false; // No previous version
  }

  return previousRobotsTxt.hash !== currentHash;
}
