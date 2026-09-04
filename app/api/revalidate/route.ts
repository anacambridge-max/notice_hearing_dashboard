import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) return NextResponse.json({ ok: false }, { status: 401 });
  revalidateTag('hearing-data');
  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() });
}
