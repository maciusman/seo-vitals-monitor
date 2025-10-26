import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/domains/:id/stats - Get domain statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get latest completed crawl
    const latestCrawl = await prisma.crawlJob.findFirst({
      where: {
        domainId: params.id,
        status: 'COMPLETED',
      },
      orderBy: { completedAt: 'desc' },
      include: {
        snapshots: true,
        changes: true,
      },
    });

    if (!latestCrawl) {
      return NextResponse.json({
        message: 'No completed crawls yet',
        stats: null,
      });
    }

    // Calculate statistics
    const snapshots = latestCrawl.snapshots;

    const statusCodes = {
      '2xx': snapshots.filter((s) => s.statusCode >= 200 && s.statusCode < 300).length,
      '3xx': snapshots.filter((s) => s.statusCode >= 300 && s.statusCode < 400).length,
      '4xx': snapshots.filter((s) => s.statusCode >= 400 && s.statusCode < 500).length,
      '5xx': snapshots.filter((s) => s.statusCode >= 500 && s.statusCode < 600).length,
    };

    const seoIssues = {
      noindex: snapshots.filter((s) => s.hasNoindex).length,
      nofollow: snapshots.filter((s) => s.hasNofollow).length,
      missingTitle: snapshots.filter((s) => !s.title).length,
      missingMetaDescription: snapshots.filter((s) => !s.metaDescription).length,
      redirects: snapshots.filter((s) => s.redirectUrl).length,
      errors: snapshots.filter((s) => s.error).length,
    };

    const changes = latestCrawl.changes;
    const changesBySeverity = {
      critical: changes.filter((c) => c.severity === 'CRITICAL').length,
      warning: changes.filter((c) => c.severity === 'WARNING').length,
      info: changes.filter((c) => c.severity === 'INFO').length,
    };

    // Average response time
    const avgResponseTime =
      snapshots.reduce((sum, s) => sum + s.responseTime, 0) / snapshots.length;

    return NextResponse.json({
      crawlJobId: latestCrawl.id,
      crawledAt: latestCrawl.completedAt,
      totalPages: snapshots.length,
      statusCodes,
      seoIssues,
      changes: changesBySeverity,
      avgResponseTime: Math.round(avgResponseTime),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
