// app/api/cards/stats/route.ts
import { NextResponse } from 'next/server';
import { getCardStats } from '@/lib/stats';

export async function GET() {
  try {
    // Get card statistics
    const stats = await getCardStats();
    
    return NextResponse.json({
      totalCount: stats.totalCount,
      collectedCount: stats.collectedCount,
      lastUpdated: stats.lastUpdated
    });
  } catch (error) {
    console.error('Error fetching card statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card statistics' },
      { status: 500 }
    );
  }
}