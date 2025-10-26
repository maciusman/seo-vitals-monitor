import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/crawl/:id - Get crawl details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const crawl = await prisma.crawlJob.findUnique({
      where: { id: params.id },
      include: {
        domain: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
        _count: {
          select: {
            snapshots: true,
            changes: true,
          },
        },
      },
    });

    if (!crawl) {
      return NextResponse.json({ error: 'Crawl not found' }, { status: 404 });
    }

    return NextResponse.json(crawl);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
