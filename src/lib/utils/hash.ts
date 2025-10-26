import { createHash } from 'crypto';

/**
 * Generate SHA256 hash
 */
export function generateHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Generate hash for content comparison (removes whitespace variations)
 */
export function generateContentHash(html: string): string {
  // Remove whitespace variations for more stable comparison
  const normalized = html
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();

  return generateHash(normalized);
}
