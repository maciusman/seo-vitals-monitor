import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/alerts - List alerts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');

    const alerts = await prisma.alert.findMany({
      where: domainId ? { domainId } : undefined,
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
            triggeredAlerts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(alerts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/alerts - Create alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domainId, name, description, rules, channels, enabled = true } = body;

    if (!domainId || !name || !rules || !channels) {
      return NextResponse.json(
        { error: 'domainId, name, rules, and channels are required' },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.create({
      data: {
        domainId,
        name,
        description,
        rules,
        channels,
        enabled,
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
