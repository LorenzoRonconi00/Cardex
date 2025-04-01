import { NextResponse } from 'next/server';
import connectToDatabase, { Card } from '@/lib/db';
import { CardUpdatePayload } from '@/lib/types';

// GET /api/cards
export async function GET() {
  try {
    await connectToDatabase();
    
    // Get all collected cards
    const collectedCards = await Card.find({ isCollected: true });
    
    return NextResponse.json(collectedCards);
  } catch (error) {
    console.error('Error fetching collected cards:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}

// POST /api/cards
export async function POST(request: Request) {
  try {
    const updates: CardUpdatePayload[] = await request.json();
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Invalid update data' }, { status: 400 });
    }
    
    console.log(`Saving ${updates.length} card updates to database:`, updates);
    
    await connectToDatabase();
    
    // Update each card
    const updatePromises = updates.map(async (update) => {
      const { id, isCollected } = update;
      
      console.log(`Updating card ${id} to ${isCollected ? 'collected' : 'uncollected'}`);
      
      // Prima cerca la carta per verificare se esiste
      const card = await Card.findOne({ id });
      
      if (card) {
        // Aggiorna la carta esistente
        return Card.findOneAndUpdate(
          { id },
          { 
            isCollected,
            ...(isCollected ? { dateCollected: new Date() } : { dateCollected: null })
          },
          { new: true } // Ritorna il documento aggiornato
        );
      } else {
        // Crea una nuova carta
        return Card.create({
          id,
          isCollected,
          ...(isCollected ? { dateCollected: new Date() } : {})
          // Mancano altri campi obbligatori come name, imageUrl, expansion
          // Ma questo è solo un fallback, non dovrebbe mai essere eseguito in pratica
        });
      }
    });
    
    const updatedCards = await Promise.all(updatePromises);
    console.log(`Successfully updated ${updatedCards.length} cards`);
    
    return NextResponse.json({ 
      success: true, 
      updatedCount: updatedCards.length,
      updatedCards: updatedCards.map(card => ({
        id: card.id,
        isCollected: card.isCollected
      }))
    });
  } catch (error) {
    console.error('Error updating cards:', error);
    return NextResponse.json({ error: 'Failed to update cards' }, { status: 500 });
  }
}