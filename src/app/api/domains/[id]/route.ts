import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { rescheduleDomain, removeScheduledCrawl } from '@/lib/jobs/scheduler';

// GET /api/domains/:id - Get domain details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const domain = await prisma.domain.findUnique({
      where: { id: params.id },
      include: {
        crawlJobs: {
          orderBy: { startedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            duration: true,
            pagesCrawled: true,
            pagesNew: true,
            pagesChanged: true,
            pagesRemoved: true,
          },
        },
        alerts: {
          where: { enabled: true },
          select: {
            id: true,
            name: true,
            enabled: true,
          },
        },
        _count: {
          select: {
            crawlJobs: true,
            alerts: true,
          },
        },
      },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    return NextResponse.json(domain);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/domains/:id - Update domain
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, crawlFrequency, maxDepth, maxPages, userAgent, followRobotsTxt, active } =
      body;

    const domain = await prisma.domain.update({
      where: { id: params.id },
      data: {
        name,
        crawlFrequency,
        maxDepth,
        maxPages,
        userAgent,
        followRobotsTxt,
        active,
      },
    });

    // Reschedule if settings changed
    if (crawlFrequency !== undefined || active !== undefined) {
      await rescheduleDomain(domain.id);
    }

    return NextResponse.json(domain);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/domains/:id - Delete domain
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Remove scheduled crawl
    await removeScheduledCrawl(params.id);

    // Delete domain (cascade will delete related data)
    await prisma.domain.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
