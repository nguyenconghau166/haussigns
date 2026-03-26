import { NextResponse } from 'next/server';
import { processFacebookQueue } from '@/lib/facebook';

export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await processFacebookQueue();

  return NextResponse.json({
    success: true,
    ...result,
  });
}
