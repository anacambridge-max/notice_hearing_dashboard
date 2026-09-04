import { NextResponse } from 'next/server';
import { getAllSheetData } from '@/lib/googleSheets';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getAllSheetData();
    return NextResponse.json(data, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to read Google Sheet.' }, { status: 500 });
  }
}
