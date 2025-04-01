import { NextResponse } from 'next/server';
import connectToDatabase, { Card, Expansion } from '@/lib/db';
import { fetchCardsByExpansion } from '@/lib/pokemon-api';

// GET /api/cards/[expansion]
export async function GET(
  request: Request,
  context: { params: { expansion: string } }
) {
  try {
    // Accediamo al parametro in modo sicuro
    const expansionSlug = context.params.expansion;
    
    if (!expansionSlug) {
      return NextResponse.json({ error: 'Expansion slug is required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Find the expansion by slug
    const expansionDoc = await Expansion.findOne({ slug: expansionSlug.toLowerCase() });
    
    if (!expansionDoc) {
      return NextResponse.json({ error: 'Expansion not found' }, { status: 404 });
    }
    
    // First check if we have any cards for this expansion in our DB
    const existingCards = await Card.find({ expansion: expansionDoc.id });
    
    // Fetch cards with collection status from database
    const apiCards = await fetchCardsByExpansion(expansionDoc.id);
    
    console.log(`Fetched ${apiCards.length} Illustration Rare cards for expansion ${expansionDoc.id}`);
    
    // For each card, check if it's already in the database
    const cardPromises = apiCards.map(async (card) => {
      // Check if we have this card in the DB with collection status
      const existingCard = await Card.findOne({ id: card.id });
      
      if (existingCard) {
        // Preserve the collection status
        console.log(`Card ${card.id} found in DB with isCollected=${existingCard.isCollected}`);
        return {
          ...card,
          isCollected: existingCard.isCollected,
          dateCollected: existingCard.dateCollected
        };
      } else {
        // Save new card to DB
        return Card.create(card);
      }
    });
    
    const cards = await Promise.all(cardPromises);
    console.log(`Returned ${cards.length} cards with collection statuses`);
    
    return NextResponse.json(cards);
  } catch (error) {
    console.error(`Error fetching cards:`, error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}