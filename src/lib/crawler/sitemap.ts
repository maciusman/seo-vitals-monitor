import Sitemapper from 'sitemapper';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

export interface SitemapUrl {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

/**
 * Fetch and parse sitemap.xml
 */
export async function fetchSitemap(sitemapUrl: string): Promise<SitemapUrl[]> {
  try {
    const sitemap = new Sitemapper({
      url: sitemapUrl,
      timeout: 15000,
      requestHeaders: {
        'User-Agent': 'SEO-Vitals-Monitor/1.0',
      },
    });

    const { sites } = await sitemap.fetch();

    return sites.map((url) => ({
      url: typeof url === 'string' ? url : url,
    }));
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    return [];
  }
}

/**
 * Discover sitemaps from common locations
 */
export async function discoverSitemaps(baseUrl: string): Promise<string[]> {
  const sitemaps: string[] = [];
  const commonLocations = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap1.xml',
    '/sitemap-index.xml',
  ];

  for (const location of commonLocations) {
    try {
      const sitemapUrl = new URL(location, baseUrl).toString();
      const response = await axios.head(sitemapUrl, {
        timeout: 5000,
        validateStatus: (status) => status === 200,
      });

      if (response.status === 200) {
        sitemaps.push(sitemapUrl);
      }
    } catch {
      // Sitemap doesn't exist
    }
  }

  return sitemaps;
}

/**
 * Get all URLs from sitemap(s)
 */
export async function getAllSitemapUrls(
  baseUrl: string,
  sitemapUrls?: string[]
): Promise<SitemapUrl[]> {
  let allUrls: SitemapUrl[] = [];

  // If no sitemaps provided, discover them
  if (!sitemapUrls || sitemapUrls.length === 0) {
    sitemapUrls = await discoverSitemaps(baseUrl);
  }

  // Fetch all sitemaps
  for (const sitemapUrl of sitemapUrls) {
    const urls = await fetchSitemap(sitemapUrl);
    allUrls = allUrls.concat(urls);
  }

  // Deduplicate
  const uniqueUrls = new Map<string, SitemapUrl>();
  allUrls.forEach((url) => {
    if (!uniqueUrls.has(url.url)) {
      uniqueUrls.set(url.url, url);
    }
  });

  return Array.from(uniqueUrls.values());
}
