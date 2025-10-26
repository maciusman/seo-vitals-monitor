import { Alert, TriggeredAlert } from '@prisma/client';
import { DetectedChange } from '@/lib/crawler/change-detector';
import nodemailer from 'nodemailer';

export interface NotificationChannel {
  type: 'email' | 'webhook';
  config: any;
}

/**
 * Send notifications for triggered alerts
 */
export async function sendAlertNotifications(
  alert: Alert,
  triggeredAlerts: TriggeredAlert[],
  changes: DetectedChange[],
  channels: NotificationChannel[]
): Promise<void> {
  for (const channel of channels) {
    try {
      switch (channel.type) {
        case 'email':
          await sendEmailNotification(alert, triggeredAlerts, changes, channel.config);
          break;

        case 'webhook':
          await sendWebhookNotification(alert, triggeredAlerts, changes, channel.config);
          break;

        default:
          console.warn(`[Notifications] Unknown channel type: ${channel.type}`);
      }
    } catch (error: any) {
      console.error(
        `[Notifications] Error sending ${channel.type} notification:`,
        error.message
      );
    }
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  alert: Alert,
  triggeredAlerts: TriggeredAlert[],
  changes: DetectedChange[],
  config: any
): Promise<void> {
  const { recipients } = config;

  if (!recipients || recipients.length === 0) {
    console.warn('[Notifications] No email recipients configured');
    return;
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: process.env.EMAIL_USER
      ? {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        }
      : undefined,
  });

  // Build email
  const subject = `[SEO Alert] ${alert.name} - ${triggeredAlerts.length} issue(s) detected`;

  const html = buildEmailHtml(alert, triggeredAlerts, changes);

  // Send email
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'alerts@seo-vitals.com',
    to: recipients.join(', '),
    subject,
    html,
  });

  console.log(`[Notifications] Email sent to ${recipients.length} recipient(s)`);
}

/**
 * Build email HTML
 */
function buildEmailHtml(
  alert: Alert,
  triggeredAlerts: TriggeredAlert[],
  changes: DetectedChange[]
): string {
  const criticalCount = triggeredAlerts.filter((ta) => ta.severity === 'CRITICAL').length;
  const warningCount = triggeredAlerts.filter((ta) => ta.severity === 'WARNING').length;
  const infoCount = triggeredAlerts.filter((ta) => ta.severity === 'INFO').length;

  let changesHtml = changes
    .slice(0, 20) // Limit to 20 changes
    .map(
      (change) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          <span style="padding: 2px 6px; border-radius: 3px; font-size: 11px; background-color: ${getSeverityColor(
            change.severity
          )}; color: white;">
            ${change.severity}
          </span>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 13px;">
          ${change.changeType.replace(/_/g, ' ')}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; word-break: break-all;">
          <a href="${change.url}" style="color: #0066cc;">${truncateUrl(change.url)}</a>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 12px;">
          ${change.description || '-'}
        </td>
      </tr>
    `
    )
    .join('');

  if (changes.length > 20) {
    changesHtml += `
      <tr>
        <td colspan="4" style="padding: 12px; text-align: center; color: #666; font-style: italic;">
          ... and ${changes.length - 20} more changes
        </td>
      </tr>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
          .summary { display: flex; gap: 15px; margin: 20px 0; }
          .summary-box { flex: 1; padding: 15px; border-radius: 6px; text-align: center; }
          .critical { background-color: #fee; border: 1px solid #fcc; }
          .warning { background-color: #fff4e6; border: 1px solid #ffd8a8; }
          .info { background-color: #e7f5ff; border: 1px solid #a5d8ff; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f1f3f5; padding: 10px; text-align: left; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0 0 10px 0; color: #212529;">SEO Alert: ${alert.name}</h2>
            <p style="margin: 0; color: #868e96;">${alert.description || ''}</p>
          </div>

          <div class="summary">
            <div class="summary-box critical">
              <div style="font-size: 24px; font-weight: bold; color: #c92a2a;">${criticalCount}</div>
              <div style="font-size: 12px; color: #666;">Critical</div>
            </div>
            <div class="summary-box warning">
              <div style="font-size: 24px; font-weight: bold; color: #e67700;">${warningCount}</div>
              <div style="font-size: 12px; color: #666;">Warning</div>
            </div>
            <div class="summary-box info">
              <div style="font-size: 24px; font-weight: bold; color: #1971c2;">${infoCount}</div>
              <div style="font-size: 12px; color: #666;">Info</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Change Type</th>
                <th>URL</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${changesHtml}
            </tbody>
          </table>

          <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 6px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}"
               style="display: inline-block; padding: 10px 20px; background-color: #228be6; color: white; text-decoration: none; border-radius: 4px;">
              View Dashboard
            </a>
          </div>

          <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #868e96;">
            <p>SEO Vitals Monitor - Automated Domain Health Tracking</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(
  alert: Alert,
  triggeredAlerts: TriggeredAlert[],
  changes: DetectedChange[],
  config: any
): Promise<void> {
  const { url, method = 'POST', headers = {} } = config;

  if (!url) {
    console.warn('[Notifications] No webhook URL configured');
    return;
  }

  const payload = {
    alert: {
      id: alert.id,
      name: alert.name,
      description: alert.description,
    },
    triggeredAlerts: triggeredAlerts.length,
    changes: changes.map((change) => ({
      url: change.url,
      changeType: change.changeType,
      severity: change.severity,
      oldValue: change.oldValue,
      newValue: change.newValue,
      description: change.description,
    })),
    timestamp: new Date().toISOString(),
  };

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed: ${response.statusText}`);
  }

  console.log(`[Notifications] Webhook notification sent to ${url}`);
}

/**
 * Helper: Get severity color
 */
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return '#c92a2a';
    case 'WARNING':
      return '#e67700';
    case 'INFO':
      return '#1971c2';
    default:
      return '#868e96';
  }
}

/**
 * Helper: Truncate URL for display
 */
function truncateUrl(url: string, maxLength: number = 60): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + '...';
}
