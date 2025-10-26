import axios from 'axios';
import robotsParser from 'robots-parser';
import { generateHash } from '@/lib/utils/hash';

export interface RobotsData {
  content: string;
  hash: string;
  isAllowed: (url: string, userAgent: string) => boolean;
  sitemaps: string[];
  crawlDelay?: number;
}

/**
 * Fetch and parse robots.txt
 */
export async function fetchRobotsTxt(
  baseUrl: string,
  userAgent: string = '*'
): Promise<RobotsData | null> {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).toString();

    const response = await axios.get(robotsUrl, {
      timeout: 10000,
      validateStatus: (status) => status === 200,
      headers: {
        'User-Agent': userAgent,
      },
    });

    const content = response.data;
    const hash = generateHash(content);

    const robots = robotsParser(robotsUrl, content);

    return {
      content,
      hash,
      isAllowed: (url: string, ua: string = userAgent) => robots.isAllowed(url, ua) ?? true,
      sitemaps: robots.getSitemaps(),
      crawlDelay: robots.getCrawlDelay(userAgent) ?? undefined,
    };
  } catch (error) {
    // No robots.txt or error fetching - allow everything
    return null;
  }
}

/**
 * Parse robots.txt content
 */
export function parseRobotsTxt(content: string, baseUrl: string): RobotsData {
  const robotsUrl = new URL('/robots.txt', baseUrl).toString();
  const hash = generateHash(content);
  const robots = robotsParser(robotsUrl, content);

  return {
    content,
    hash,
    isAllowed: (url: string, userAgent: string = '*') => robots.isAllowed(url, userAgent) ?? true,
    sitemaps: robots.getSitemaps(),
    crawlDelay: robots.getCrawlDelay('*') ?? undefined,
  };
}

/**
 * Check if URL is disallowed for all user agents
 */
export function isDisallowedForAll(content: string, url: string, baseUrl: string): boolean {
  const parsed = parseRobotsTxt(content, baseUrl);
  const commonBots = ['*', 'Googlebot', 'Bingbot', 'Yahoo', 'DuckDuckBot'];

  return commonBots.every((bot) => !parsed.isAllowed(url, bot));
}
