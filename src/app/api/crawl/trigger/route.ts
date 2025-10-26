import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { addCrawlJob } from '@/lib/jobs/queue';

// POST /api/crawl/trigger - Trigger manual crawl
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domainId } = body;

    if (!domainId) {
      return NextResponse.json({ error: 'domainId is required' }, { status: 400 });
    }

    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Add job to queue
    const job = await addCrawlJob({
      domainId: domain.id,
      baseUrl: domain.url,
      maxDepth: domain.maxDepth,
      maxPages: domain.maxPages,
      userAgent: domain.userAgent || undefined,
    });

    return NextResponse.json({
      message: 'Crawl job queued',
      jobId: job.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
