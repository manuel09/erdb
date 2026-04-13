import { NextResponse } from 'next/server';
import { accountsDb } from '@/lib/accountsDb';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const row = accountsDb.prepare('SELECT COUNT(*) as count FROM tokens').get() as { count: number };
    return NextResponse.json({ userCount: row.count });
  } catch {
    return NextResponse.json({ userCount: 0 });
  }
}
