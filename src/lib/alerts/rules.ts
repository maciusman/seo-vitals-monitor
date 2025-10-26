import { ChangeType, Severity } from '@prisma/client';
import { DetectedChange } from '@/lib/crawler/change-detector';

export interface AlertRule {
  type: 'change_type' | 'status_code_change' | 'severity' | 'url_pattern' | 'custom';
  condition: any;
}

export interface AlertRuleConfig {
  rules: AlertRule[];
  matchAll?: boolean; // AND vs OR logic
}

/**
 * Check if a change matches alert rules
 */
export function matchesAlertRules(
  change: DetectedChange,
  rulesConfig: AlertRuleConfig
): boolean {
  const { rules, matchAll = false } = rulesConfig;

  if (rules.length === 0) return false;

  const matches = rules.map((rule) => matchesRule(change, rule));

  // AND logic - all rules must match
  if (matchAll) {
    return matches.every((m) => m);
  }

  // OR logic - at least one rule must match
  return matches.some((m) => m);
}

/**
 * Check if change matches a single rule
 */
function matchesRule(change: DetectedChange, rule: AlertRule): boolean {
  switch (rule.type) {
    case 'change_type':
      return matchChangeType(change, rule.condition);

    case 'status_code_change':
      return matchStatusCodeChange(change, rule.condition);

    case 'severity':
      return matchSeverity(change, rule.condition);

    case 'url_pattern':
      return matchUrlPattern(change, rule.condition);

    case 'custom':
      return matchCustomRule(change, rule.condition);

    default:
      return false;
  }
}

/**
 * Match change type
 */
function matchChangeType(change: DetectedChange, condition: any): boolean {
  const { types } = condition;

  if (!types || !Array.isArray(types)) return false;

  return types.includes(change.changeType);
}

/**
 * Match status code change
 */
function matchStatusCodeChange(change: DetectedChange, condition: any): boolean {
  if (change.changeType !== ChangeType.STATUS_CODE_CHANGED) {
    return false;
  }

  const { from, to } = condition;

  const oldStatus = parseInt(change.oldValue || '0');
  const newStatus = parseInt(change.newValue || '0');

  // Check if old status matches 'from' condition
  const fromMatch =
    !from ||
    (Array.isArray(from) && from.includes(oldStatus)) ||
    (typeof from === 'number' && from === oldStatus);

  // Check if new status matches 'to' condition
  const toMatch =
    !to ||
    (Array.isArray(to) && to.includes(newStatus)) ||
    (typeof to === 'number' && to === newStatus);

  return fromMatch && toMatch;
}

/**
 * Match severity
 */
function matchSeverity(change: DetectedChange, condition: any): boolean {
  const { levels } = condition;

  if (!levels || !Array.isArray(levels)) return false;

  return levels.includes(change.severity);
}

/**
 * Match URL pattern
 */
function matchUrlPattern(change: DetectedChange, condition: any): boolean {
  const { pattern, type = 'contains' } = condition;

  if (!pattern) return false;

  switch (type) {
    case 'contains':
      return change.url.includes(pattern);

    case 'startsWith':
      return change.url.startsWith(pattern);

    case 'endsWith':
      return change.url.endsWith(pattern);

    case 'regex':
      try {
        const regex = new RegExp(pattern);
        return regex.test(change.url);
      } catch {
        return false;
      }

    default:
      return false;
  }
}

/**
 * Match custom rule (advanced)
 */
function matchCustomRule(change: DetectedChange, condition: any): boolean {
  // Custom rule evaluation
  // This could be extended to support complex expressions
  return false;
}

/**
 * Predefined alert rule templates
 */
export const ALERT_TEMPLATES = {
  // Critical SEO issues
  noindex_added: {
    name: 'Noindex Tag Added',
    description: 'Alert when a noindex tag is added to any page',
    rules: [
      {
        type: 'change_type',
        condition: { types: [ChangeType.NOINDEX_ADDED] },
      },
    ],
  },

  // Status code degradation
  page_down: {
    name: 'Page Down (200 → 4xx/5xx)',
    description: 'Alert when a working page returns an error',
    rules: [
      {
        type: 'status_code_change',
        condition: {
          from: [200, 201, 202, 203, 204],
          to: Array.from({ length: 200 }, (_, i) => i + 400), // 400-599
        },
      },
    ],
  },

  // Redirect changes
  redirect_added: {
    name: 'Redirect Added',
    description: 'Alert when a redirect is added to a page',
    rules: [
      {
        type: 'change_type',
        condition: { types: [ChangeType.REDIRECT_ADDED, ChangeType.REDIRECT_CHANGED] },
      },
    ],
  },

  // Robots.txt changes
  robots_txt_changed: {
    name: 'Robots.txt Changed',
    description: 'Alert when robots.txt file is modified',
    rules: [
      {
        type: 'change_type',
        condition: { types: [ChangeType.ROBOTS_TXT_CHANGED] },
      },
    ],
  },

  // Critical severity
  critical_changes: {
    name: 'Critical Changes',
    description: 'Alert on any critical severity changes',
    rules: [
      {
        type: 'severity',
        condition: { levels: [Severity.CRITICAL] },
      },
    ],
  },

  // Slow pages
  slow_response: {
    name: 'Slow Response Time',
    description: 'Alert when page response time increases significantly',
    rules: [
      {
        type: 'change_type',
        condition: { types: [ChangeType.SLOW_RESPONSE] },
      },
    ],
  },
};
