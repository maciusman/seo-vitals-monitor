import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/crawl/:id/pages - Get pages from crawl
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const statusCode = searchParams.get('statusCode');
    const hasNoindex = searchParams.get('hasNoindex');
    const hasError = searchParams.get('hasError');

    const where: any = { crawlJobId: params.id };

    if (statusCode) {
      where.statusCode = parseInt(statusCode);
    }

    if (hasNoindex === 'true') {
      where.hasNoindex = true;
    }

    if (hasError === 'true') {
      where.error = { not: null };
    }

    const pages = await prisma.pageSnapshot.findMany({
      where,
      orderBy: { url: 'asc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.pageSnapshot.count({ where });

    return NextResponse.json({
      pages,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
