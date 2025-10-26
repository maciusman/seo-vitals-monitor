import { prisma } from '@/lib/db/prisma';
import { fetchRobotsTxt, RobotsData } from './robots';
import { getAllSitemapUrls, SitemapUrl } from './sitemap';
import { analyzePage, PageAnalysis } from './analyzer';
import { normalizeUrl, isInternalUrl } from '@/lib/utils/url';
import { CrawlStatus, Prisma } from '@prisma/client';

export interface CrawlerConfig {
  domainId: string;
  baseUrl: string;
  maxDepth?: number;
  maxPages?: number;
  userAgent?: string;
  followRobotsTxt?: boolean;
  respectCrawlDelay?: boolean;
  concurrency?: number;
}

export interface CrawlerProgress {
  total: number;
  crawled: number;
  queued: number;
  errors: number;
}

export class WebCrawler {
  private config: CrawlerConfig;
  private crawlJobId: string | null = null;
  private visitedUrls = new Set<string>();
  private queuedUrls = new Set<string>();
  private robots: RobotsData | null = null;
  private startTime: number = 0;
  private pagesCrawled = 0;
  private errors: any[] = [];

  constructor(config: CrawlerConfig) {
    this.config = {
      maxDepth: 5,
      maxPages: 1000,
      userAgent: 'SEO-Vitals-Monitor/1.0',
      followRobotsTxt: true,
      respectCrawlDelay: true,
      concurrency: 5,
      ...config,
    };
  }

  /**
   * Start crawling
   */
  async crawl(): Promise<string> {
    this.startTime = Date.now();

    try {
      // Create crawl job
      const crawlJob = await prisma.crawlJob.create({
        data: {
          domainId: this.config.domainId,
          status: CrawlStatus.RUNNING,
        },
      });

      this.crawlJobId = crawlJob.id;

      console.log(`[Crawler] Started crawl job ${this.crawlJobId} for ${this.config.baseUrl}`);

      // Step 1: Fetch robots.txt
      if (this.config.followRobotsTxt) {
        console.log('[Crawler] Fetching robots.txt...');
        this.robots = await fetchRobotsTxt(this.config.baseUrl, this.config.userAgent);

        if (this.robots) {
          // Save robots.txt to database
          await prisma.robotsTxt.create({
            data: {
              domainId: this.config.domainId,
              content: this.robots.content,
              hash: this.robots.hash,
            },
          });
          console.log(`[Crawler] Found robots.txt with ${this.robots.sitemaps.length} sitemaps`);
        }
      }

      // Step 2: Get URLs from sitemap
      console.log('[Crawler] Fetching sitemap URLs...');
      const sitemapUrls = this.robots?.sitemaps || [];
      const urlsFromSitemap = await getAllSitemapUrls(this.config.baseUrl, sitemapUrls);
      console.log(`[Crawler] Found ${urlsFromSitemap.length} URLs in sitemap`);

      // Step 3: Initialize queue with sitemap URLs and homepage
      const initialUrls = [
        this.config.baseUrl,
        ...urlsFromSitemap.map((u) => u.url),
      ];

      // Add to queue
      for (const url of initialUrls) {
        this.addToQueue(url);
      }

      // Step 4: Crawl URLs
      await this.crawlQueue();

      // Step 5: Mark as completed
      const duration = Math.floor((Date.now() - this.startTime) / 1000);

      await prisma.crawlJob.update({
        where: { id: this.crawlJobId },
        data: {
          status: CrawlStatus.COMPLETED,
          completedAt: new Date(),
          duration,
          pagesCrawled: this.pagesCrawled,
          pagesFound: this.visitedUrls.size,
          errors: this.errors.length > 0 ? JSON.stringify(this.errors) : null,
        },
      });

      console.log(`[Crawler] Completed crawl job ${this.crawlJobId}`);
      console.log(`[Crawler] Crawled ${this.pagesCrawled} pages in ${duration}s`);

      // Update domain last crawled
      await prisma.domain.update({
        where: { id: this.config.domainId },
        data: {
          lastCrawledAt: new Date(),
        },
      });

      return this.crawlJobId;
    } catch (error: any) {
      console.error('[Crawler] Error:', error);

      if (this.crawlJobId) {
        await prisma.crawlJob.update({
          where: { id: this.crawlJobId },
          data: {
            status: CrawlStatus.FAILED,
            completedAt: new Date(),
            errors: JSON.stringify([{ message: error.message, stack: error.stack }]),
          },
        });
      }

      throw error;
    }
  }

  /**
   * Add URL to queue
   */
  private addToQueue(url: string) {
    const normalized = normalizeUrl(url);

    // Skip if already visited or queued
    if (this.visitedUrls.has(normalized) || this.queuedUrls.has(normalized)) {
      return;
    }

    // Skip if not internal
    if (!isInternalUrl(url, this.config.baseUrl)) {
      return;
    }

    // Skip if blocked by robots.txt
    if (this.robots && !this.robots.isAllowed(url, this.config.userAgent!)) {
      return;
    }

    // Check max pages limit
    if (this.visitedUrls.size + this.queuedUrls.size >= this.config.maxPages!) {
      return;
    }

    this.queuedUrls.add(normalized);
  }

  /**
   * Crawl all queued URLs
   */
  private async crawlQueue() {
    const concurrency = this.config.concurrency!;
    const queue = Array.from(this.queuedUrls);

    // Process in batches
    for (let i = 0; i < queue.length; i += concurrency) {
      const batch = queue.slice(i, i + concurrency);
      await Promise.all(batch.map((url) => this.crawlUrl(url)));

      // Respect crawl delay
      if (this.robots?.crawlDelay && this.config.respectCrawlDelay) {
        await this.sleep(this.robots.crawlDelay * 1000);
      } else {
        // Small delay between batches
        await this.sleep(100);
      }

      // Log progress
      console.log(
        `[Crawler] Progress: ${this.pagesCrawled}/${this.visitedUrls.size} pages crawled`
      );
    }
  }

  /**
   * Crawl a single URL
   */
  private async crawlUrl(url: string) {
    const normalized = normalizeUrl(url);

    // Mark as visited
    this.visitedUrls.add(normalized);
    this.queuedUrls.delete(normalized);

    try {
      // Analyze page
      const analysis = await analyzePage(
        url,
        this.config.baseUrl,
        this.config.userAgent,
        30000
      );

      // Save snapshot
      await this.saveSnapshot(analysis);

      // Discover new links
      if (analysis.links && analysis.statusCode === 200) {
        for (const link of analysis.links) {
          this.addToQueue(link);
        }
      }

      this.pagesCrawled++;
    } catch (error: any) {
      console.error(`[Crawler] Error crawling ${url}:`, error.message);
      this.errors.push({
        url,
        error: error.message,
      });

      // Save error snapshot
      await this.saveSnapshot({
        url,
        normalizedUrl: normalized,
        finalUrl: url,
        statusCode: 0,
        statusMessage: error.message,
        responseTime: 0,
        contentHash: '',
        hasNoindex: false,
        hasNofollow: false,
        internalLinks: 0,
        externalLinks: 0,
        links: [],
        error: error.message,
        errorType: error.code || 'UNKNOWN_ERROR',
      });
    }
  }

  /**
   * Save page snapshot to database
   */
  private async saveSnapshot(analysis: PageAnalysis) {
    if (!this.crawlJobId) return;

    await prisma.pageSnapshot.create({
      data: {
        crawlJobId: this.crawlJobId,
        url: analysis.url,
        normalizedUrl: analysis.normalizedUrl,
        statusCode: analysis.statusCode,
        statusMessage: analysis.statusMessage,
        redirectUrl: analysis.redirectUrl,
        redirectChain: analysis.redirectChain ? JSON.stringify(analysis.redirectChain) : null,
        finalUrl: analysis.finalUrl,
        title: analysis.title,
        metaDescription: analysis.metaDescription,
        h1: analysis.h1,
        canonicalUrl: analysis.canonicalUrl,
        metaRobots: analysis.metaRobots,
        xRobotsTag: analysis.xRobotsTag,
        hasNoindex: analysis.hasNoindex,
        hasNofollow: analysis.hasNofollow,
        responseTime: analysis.responseTime,
        contentLength: analysis.contentLength,
        contentType: analysis.contentType,
        contentHash: analysis.contentHash,
        htmlHash: analysis.htmlHash,
        internalLinks: analysis.internalLinks,
        externalLinks: analysis.externalLinks,
        error: analysis.error,
        errorType: analysis.errorType,
      },
    });
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get progress
   */
  getProgress(): CrawlerProgress {
    return {
      total: this.visitedUrls.size + this.queuedUrls.size,
      crawled: this.pagesCrawled,
      queued: this.queuedUrls.size,
      errors: this.errors.length,
    };
  }
}
