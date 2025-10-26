import { URL } from 'url';

/**
 * Normalize URL - usuwa trailing slash, sortuje query params, etc.
 */
export function normalizeUrl(urlString: string): string {
  try {
    const url = new URL(urlString);

    // Remove trailing slash from pathname
    url.pathname = url.pathname.replace(/\/$/, '') || '/';

    // Sort query parameters
    const params = Array.from(url.searchParams.entries()).sort();
    url.search = '';
    params.forEach(([key, value]) => url.searchParams.append(key, value));

    // Remove default ports
    if (
      (url.protocol === 'http:' && url.port === '80') ||
      (url.protocol === 'https:' && url.port === '443')
    ) {
      url.port = '';
    }

    return url.toString();
  } catch (error) {
    return urlString;
  }
}

/**
 * Check if URL is internal (same domain)
 */
export function isInternalUrl(url: string, baseDomain: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseObj = new URL(baseDomain);
    return urlObj.hostname === baseObj.hostname;
  } catch {
    return false;
  }
}

/**
 * Resolve relative URL to absolute
 */
export function resolveUrl(baseUrl: string, relativeUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).toString();
  } catch {
    return relativeUrl;
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
