import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/crawl/:id/changes - Get changes from crawl
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const changeType = searchParams.get('changeType');

    const where: any = { crawlJobId: params.id };

    if (severity) {
      where.severity = severity;
    }

    if (changeType) {
      where.changeType = changeType;
    }

    const changes = await prisma.changeDetection.findMany({
      where,
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(changes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
