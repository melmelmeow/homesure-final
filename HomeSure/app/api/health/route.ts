import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    app: 'HomeSure Next.js Backend API',
    timestamp: new Date().toISOString(),
    services: {
      supabase: 'configured',
      xendit: 'configured',
    },
  });
}
