import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/domains/:id/crawls - Get crawl history for domain
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const crawls = await prisma.crawlJob.findMany({
      where: { domainId: params.id },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: {
            snapshots: true,
            changes: true,
          },
        },
      },
    });

    const total = await prisma.crawlJob.count({
      where: { domainId: params.id },
    });

    return NextResponse.json({
      crawls,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
