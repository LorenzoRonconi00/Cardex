// app/api/cards/direct/[expansion]/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase, { Card, Expansion } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: Request,
  context: { params: { expansion: string } }
) {
  try {
    console.log("API route chiamata: /api/cards/direct/[expansion]");
    
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Verify authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Autenticazione richiesta' }, { status: 401 });
    }
    
    // Get expansion slug
    const expansionSlug = context.params.expansion;
    
    if (!expansionSlug) {
      return NextResponse.json({ error: 'Expansion slug is required' }, { status: 400 });
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Get current user ID
    const userId = session.user.id;
    
    // Find the expansion by slug
    const expansionDoc = await Expansion.findOne({ slug: expansionSlug.toLowerCase() });
    
    if (!expansionDoc) {
      return NextResponse.json({ error: 'Expansion not found' }, { status: 404 });
    }

    // Recupera tutte le carte template Illustration Rare per questa espansione
    const templateCards = await Card.find({
      expansion: expansionSlug,
      userId: { $exists: false },
      type: 'illustration_rare'
    }).lean();
    
    console.log(`Recuperate ${templateCards.length} carte template Illustration Rare per l'espansione ${expansionSlug}`);
    
    // Se non ci sono carte template, restituisci un array vuoto
    if (templateCards.length === 0) {
      return NextResponse.json([]);
    }
    
    // Ottieni tutti gli ID delle carte template
    const cardIds = templateCards.map(card => card.id);
    
    // Recupera le carte dell'utente che corrispondono agli ID delle carte template
    const userCards = await Card.find({
      id: { $in: cardIds },
      userId: userId
    }).lean();
    
    console.log(`Recuperate ${userCards.length} carte dell'utente per l'espansione ${expansionSlug}`);
    
    // Crea una mappa delle carte dell'utente per una ricerca più veloce
    const userCardMap = new Map();
    userCards.forEach(card => {
      userCardMap.set(card.id, card);
    });
    
    // Combina le carte template con lo stato di collezione dell'utente
    const mergedCards = templateCards.map(templateCard => {
      const userCard = userCardMap.get(templateCard.id);
      
      // Se l'utente ha questa carta, usa il suo stato di collezione
      if (userCard) {
        return {
          ...templateCard,
          isCollected: userCard.isCollected,
          dateCollected: userCard.dateCollected,
          userId: userId
        };
      }
      
      // Altrimenti, usa la carta template ma imposta come non collezionata
      return {
        ...templateCard,
        isCollected: false,
        dateCollected: null,
        userId: userId
      };
    });
    
    console.log(`Restituite ${mergedCards.length} carte Illustration Rare con stato di collezione per l'espansione ${expansionSlug}`);
    
    return NextResponse.json(mergedCards);
  } catch (error) {
    console.error(`Errore nel recupero delle carte per l'espansione:`, error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}