// Type definitions for the application

export interface DomainStats {
  crawlJobId: string;
  crawledAt: Date | null;
  totalPages: number;
  statusCodes: {
    '2xx': number;
    '3xx': number;
    '4xx': number;
    '5xx': number;
  };
  seoIssues: {
    noindex: number;
    nofollow: number;
    missingTitle: number;
    missingMetaDescription: number;
    redirects: number;
    errors: number;
  };
  changes: {
    critical: number;
    warning: number;
    info: number;
  };
  avgResponseTime: number;
}

export interface CrawlProgress {
  total: number;
  crawled: number;
  queued: number;
  errors: number;
}
