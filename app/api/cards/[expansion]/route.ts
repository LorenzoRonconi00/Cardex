import { NextResponse } from 'next/server';
import connectToDatabase, { Card, Expansion } from '@/lib/db';
import { fetchCardsByExpansion } from '@/lib/pokemon-api';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET /api/cards/[expansion]
export async function GET(
  request: Request,
  context: { params: { expansion: string } }
) {
  try {
    // Ottieni la sessione dell'utente
    const session = await getServerSession(authOptions);
    
    // Verifica se l'utente è autenticato
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Autenticazione richiesta' }, { status: 401 });
    }
    
    // Accedi al parametro expansion in modo sicuro
    const expansionSlug = context.params.expansion;
    
    if (!expansionSlug) {
      return NextResponse.json({ error: 'Expansion slug is required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Trova l'espansione tramite slug
    const expansionDoc = await Expansion.findOne({ slug: expansionSlug.toLowerCase() });
    
    if (!expansionDoc) {
      return NextResponse.json({ error: 'Expansion not found' }, { status: 404 });
    }
    
    // ID utente dalla sessione
    const userId = session.user.id;
    
    // Fetch cards with collection status from database
    const apiCards = await fetchCardsByExpansion(expansionDoc.id);
    
    console.log(`Fetched ${apiCards.length} Illustration Rare cards for expansion ${expansionDoc.id}`);
    
    // For each card, check if it's already in the database for this user
    const cardPromises = apiCards.map(async (card) => {
      // Check if we have this card in the DB with collection status for this user
      const existingCard = await Card.findOne({ 
        id: card.id,
        userId: userId // Filtra per l'utente corrente
      });
      
      if (existingCard) {
        // Preserve the collection status
        console.log(`Card ${card.id} found in DB for user ${userId} with isCollected=${existingCard.isCollected}`);
        return {
          ...card,
          isCollected: existingCard.isCollected,
          dateCollected: existingCard.dateCollected
        };
      } else {
        // Non creare una nuova carta nel DB, restituisci semplicemente la carta con isCollected=false
        return {
          ...card,
          isCollected: false,
          dateCollected: null,
          userId: userId // Aggiungi l'ID utente per il frontend (non verrà salvato nel DB qui)
        };
      }
    });
    
    const cards = await Promise.all(cardPromises);
    console.log(`Returned ${cards.length} cards with collection statuses for user ${userId}`);
    
    return NextResponse.json(cards);
  } catch (error) {
    console.error(`Error fetching cards:`, error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}