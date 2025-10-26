import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { rescheduleDomain } from '@/lib/jobs/scheduler';

// GET /api/domains - List all domains
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    const domains = await prisma.domain.findMany({
      where: active !== null ? { active: active === 'true' } : undefined,
      include: {
        _count: {
          select: {
            crawlJobs: true,
            alerts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(domains);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/domains - Create new domain
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      url,
      name,
      crawlFrequency = 2,
      maxDepth = 5,
      maxPages = 1000,
      userAgent,
      followRobotsTxt = true,
    } = body;

    if (!url || !name) {
      return NextResponse.json({ error: 'URL and name are required' }, { status: 400 });
    }

    // Create domain
    const domain = await prisma.domain.create({
      data: {
        url,
        name,
        crawlFrequency,
        maxDepth,
        maxPages,
        userAgent,
        followRobotsTxt,
        active: true,
      },
    });

    // Schedule crawling
    await rescheduleDomain(domain.id);

    return NextResponse.json(domain, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
