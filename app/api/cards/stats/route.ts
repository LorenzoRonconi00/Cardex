// app/api/cards/stats/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase, { Card, Expansion } from '@/lib/db';

export async function GET() {
  try {
    console.log("API route chiamata: /api/cards/stats");
    
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Verify authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Autenticazione richiesta' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Connect to database
    await connectToDatabase();
    
    // Get all expansions from database
    const expansions = await Expansion.find({}).lean();
    console.log(`Recuperate ${expansions.length} espansioni dal database`);
    
    // Initialize the stats object
    const expansionStats: Record<string, { 
      total: number;
      collected: number;
      percentage: number;
      name: string;
    }> = {};
    
    // Query all Illustration Rare template cards
    const allIllustrationRareCards = await Card.find({
      userId: { $exists: false },
      type: 'illustration_rare'
    }).lean();
    
    console.log(`Recuperate ${allIllustrationRareCards.length} carte Illustration Rare totali dal database`);
    
    // Group cards by expansion
    const cardsByExpansion: Record<string, typeof allIllustrationRareCards[0][]> = {};
    allIllustrationRareCards.forEach(card => {
      if (!cardsByExpansion[card.expansion]) {
        cardsByExpansion[card.expansion] = [];
      }
      cardsByExpansion[card.expansion].push(card);
    });
    
    // Get all collected Illustration Rare cards for this user
    const userCollectedCards = await Card.find({ 
      userId: userId,
      isCollected: true,
      type: 'illustration_rare'
    }).lean();
    
    console.log(`Recuperate ${userCollectedCards.length} carte Illustration Rare collezionate dall'utente`);
    
    // Group collected cards by expansion
    const collectedByExpansion: Record<string, number> = {};
    userCollectedCards.forEach(card => {
      if (!collectedByExpansion[card.expansion]) {
        collectedByExpansion[card.expansion] = 0;
      }
      collectedByExpansion[card.expansion]++;
    });
    
    // Calculate stats for each expansion
    for (const expansion of expansions) {
      const cards = cardsByExpansion[expansion.slug] || [];
      const total = cards.length;
      const collected = collectedByExpansion[expansion.slug] || 0;
      const percentage = total > 0 ? Math.round((collected / total) * 100) : 0;
      
      expansionStats[expansion.slug] = {
        total,
        collected,
        percentage,
        name: expansion.name
      };
    }
    
    console.log("Statistiche calcolate per tutte le espansioni (solo Illustration Rare)");
    return NextResponse.json(expansionStats);
  } catch (error) {
    console.error('Error fetching expansion stats:', error);
    return NextResponse.json({ error: 'Failed to fetch expansion stats' }, { status: 500 });
  }
}