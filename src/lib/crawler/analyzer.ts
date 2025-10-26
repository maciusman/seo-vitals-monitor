import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { generateHash, generateContentHash } from '@/lib/utils/hash';
import { normalizeUrl, isInternalUrl, resolveUrl } from '@/lib/utils/url';

export interface PageAnalysis {
  // Request info
  url: string;
  normalizedUrl: string;
  finalUrl: string;

  // Response
  statusCode: number;
  statusMessage: string;
  responseTime: number;

  // Redirects
  redirectUrl?: string;
  redirectChain?: string[];

  // Content
  title?: string;
  metaDescription?: string;
  h1?: string;
  canonicalUrl?: string;

  // SEO Critical
  metaRobots?: string;
  xRobotsTag?: string;
  hasNoindex: boolean;
  hasNofollow: boolean;

  // Content info
  contentType?: string;
  contentLength?: number;
  contentHash: string;
  htmlHash?: string;

  // Links
  internalLinks: number;
  externalLinks: number;
  links: string[];

  // Errors
  error?: string;
  errorType?: string;
}

/**
 * Analyze a single page
 */
export async function analyzePage(
  url: string,
  baseDomain: string,
  userAgent: string = 'SEO-Vitals-Monitor/1.0',
  timeout: number = 30000
): Promise<PageAnalysis> {
  const startTime = Date.now();
  const normalizedUrl = normalizeUrl(url);

  try {
    const response = await axios.get(url, {
      timeout,
      maxRedirects: 10,
      validateStatus: () => true, // Accept all status codes
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const responseTime = Date.now() - startTime;
    const finalUrl = response.request.res.responseUrl || url;

    // Parse HTML if content type is HTML
    const contentType = response.headers['content-type'] || '';
    const isHtml = contentType.includes('text/html');

    let analysis: PageAnalysis = {
      url,
      normalizedUrl,
      finalUrl,
      statusCode: response.status,
      statusMessage: response.statusText,
      responseTime,
      contentType,
      contentLength: response.data?.length || 0,
      contentHash: generateHash(response.data || ''),
      hasNoindex: false,
      hasNofollow: false,
      internalLinks: 0,
      externalLinks: 0,
      links: [],
    };

    // Check X-Robots-Tag header
    const xRobotsTag = response.headers['x-robots-tag'];
    if (xRobotsTag) {
      analysis.xRobotsTag = xRobotsTag;
      analysis.hasNoindex = /noindex/i.test(xRobotsTag);
      analysis.hasNofollow = /nofollow/i.test(xRobotsTag);
    }

    // Track redirects
    if (response.request._redirectable?._redirectCount > 0) {
      analysis.redirectChain = [url];
      // Note: Getting full redirect chain from axios is complex
      // For simplicity, we'll just note there was a redirect
      if (finalUrl !== url) {
        analysis.redirectUrl = finalUrl;
      }
    }

    // Parse HTML content
    if (isHtml && response.data) {
      const htmlAnalysis = parseHtml(response.data, url, baseDomain);
      analysis = { ...analysis, ...htmlAnalysis };
    }

    return analysis;
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      url,
      normalizedUrl,
      finalUrl: url,
      statusCode: error.response?.status || 0,
      statusMessage: error.message,
      responseTime,
      contentHash: '',
      hasNoindex: false,
      hasNofollow: false,
      internalLinks: 0,
      externalLinks: 0,
      links: [],
      error: error.message,
      errorType: error.code || 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Parse HTML and extract SEO data
 */
function parseHtml(html: string, pageUrl: string, baseDomain: string) {
  const $ = cheerio.load(html);

  // Title
  const title = $('title').first().text().trim() || undefined;

  // Meta description
  const metaDescription =
    $('meta[name="description"]').attr('content')?.trim() || undefined;

  // H1
  const h1 = $('h1').first().text().trim() || undefined;

  // Canonical
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || undefined;

  // Meta robots
  const metaRobots = $('meta[name="robots"]').attr('content') || undefined;
  const hasNoindex = metaRobots ? /noindex/i.test(metaRobots) : false;
  const hasNofollow = metaRobots ? /nofollow/i.test(metaRobots) : false;

  // Extract all links
  const links: string[] = [];
  let internalLinks = 0;
  let externalLinks = 0;

  $('a[href]').each((_, elem) => {
    const href = $(elem).attr('href');
    if (href) {
      try {
        const absoluteUrl = resolveUrl(pageUrl, href);
        links.push(absoluteUrl);

        if (isInternalUrl(absoluteUrl, baseDomain)) {
          internalLinks++;
        } else {
          externalLinks++;
        }
      } catch {
        // Invalid URL
      }
    }
  });

  // HTML hash
  const htmlHash = generateContentHash(html);

  return {
    title,
    metaDescription,
    h1,
    canonicalUrl,
    metaRobots,
    hasNoindex,
    hasNofollow,
    htmlHash,
    internalLinks,
    externalLinks,
    links: Array.from(new Set(links)), // Deduplicate
  };
}
