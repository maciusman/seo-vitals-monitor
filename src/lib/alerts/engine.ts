import { prisma } from '@/lib/db/prisma';
import { DetectedChange } from '@/lib/crawler/change-detector';
import { matchesAlertRules, AlertRuleConfig } from './rules';
import { sendAlertNotifications } from './notifications';

/**
 * Process alerts for detected changes
 */
export async function processAlerts(
  domainId: string,
  crawlJobId: string,
  changes: DetectedChange[]
): Promise<void> {
  // Get all enabled alerts for domain
  const alerts = await prisma.alert.findMany({
    where: {
      domainId,
      enabled: true,
    },
  });

  if (alerts.length === 0) {
    console.log(`[Alerts] No alerts configured for domain ${domainId}`);
    return;
  }

  console.log(`[Alerts] Processing ${alerts.length} alerts for ${changes.length} changes`);

  for (const alert of alerts) {
    try {
      // Parse rules
      const rulesConfig = alert.rules as AlertRuleConfig;

      // Find matching changes
      const matchingChanges = changes.filter((change) =>
        matchesAlertRules(change, rulesConfig)
      );

      if (matchingChanges.length === 0) {
        continue;
      }

      console.log(
        `[Alerts] Alert "${alert.name}" triggered by ${matchingChanges.length} changes`
      );

      // Create triggered alert records
      const triggeredAlerts = await Promise.all(
        matchingChanges.map((change) =>
          prisma.triggeredAlert.create({
            data: {
              alertId: alert.id,
              crawlJobId,
              severity: change.severity,
              message: change.description || `Change detected: ${change.changeType}`,
              details: {
                url: change.url,
                changeType: change.changeType,
                oldValue: change.oldValue,
                newValue: change.newValue,
              },
            },
          })
        )
      );

      // Send notifications
      const channels = alert.channels as any[];
      if (channels && channels.length > 0) {
        await sendAlertNotifications(alert, triggeredAlerts, matchingChanges, channels);

        // Mark as notified
        await prisma.triggeredAlert.updateMany({
          where: {
            id: { in: triggeredAlerts.map((ta) => ta.id) },
          },
          data: {
            notified: true,
            notifiedAt: new Date(),
          },
        });
      }
    } catch (error: any) {
      console.error(`[Alerts] Error processing alert ${alert.id}:`, error.message);
    }
  }
}

/**
 * Test alert configuration
 */
export async function testAlert(alertId: string, testChanges: DetectedChange[]): Promise<boolean> {
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
  });

  if (!alert) {
    throw new Error(`Alert ${alertId} not found`);
  }

  const rulesConfig = alert.rules as AlertRuleConfig;

  const matchingChanges = testChanges.filter((change) =>
    matchesAlertRules(change, rulesConfig)
  );

  return matchingChanges.length > 0;
}
