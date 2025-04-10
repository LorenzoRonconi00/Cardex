import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase, { Card } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// POST /api/cards - Salva le carte aggiornate
export async function POST(request: NextRequest) {
  try {
    // Verifica l'autenticazione dell'utente
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Autenticazione richiesta' }, { status: 401 });
    }
    
    // ID utente dalla sessione
    const userId = session.user.id;
    
    // Leggi i dati dal body della richiesta
    const updates = await request.json();
    
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Expected an array of card updates' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    console.log(`Processing ${updates.length} card updates for user ${userId}`);
    
    // Processa ogni aggiornamento di carta
    const updatePromises = updates.map(async (update) => {
      const { id, isCollected, name, imageUrl, expansion } = update;
      
      if (!id) {
        console.warn('Skipping update with missing id');
        return null;
      }
      
      try {
        // Prima controlla se esiste già una carta per questo utente
        const existingCard = await Card.findOne({ id, userId });
        
        if (existingCard) {
          // Se esiste, aggiorna i campi
          console.log(`Updating existing card ${id} for user ${userId}`);
          existingCard.isCollected = isCollected;
          existingCard.dateCollected = isCollected ? new Date() : null;
          existingCard.name = name || existingCard.name;
          existingCard.imageUrl = imageUrl || existingCard.imageUrl;
          existingCard.expansion = expansion || existingCard.expansion;
          return await existingCard.save();
        } else {
          // Se non esiste, controlla se esiste già un record per questa carta (per un altro utente)
          // e usa quei dati per creare un nuovo record per l'utente corrente
          const cardTemplate = await Card.findOne({ id });
          
          if (cardTemplate) {
            // Se esiste un template, crea una nuova carta per questo utente basandosi su di esso
            console.log(`Creating card ${id} for user ${userId} based on existing template`);
            return await Card.create({
              id,
              name: name || cardTemplate.name,
              imageUrl: imageUrl || cardTemplate.imageUrl,
              expansion: expansion || cardTemplate.expansion,
              isCollected,
              dateCollected: isCollected ? new Date() : null,
              userId
            });
          } else {
            // Se non esiste alcun template, crea una nuova carta usando i dati forniti
            console.log(`Creating brand new card ${id} for user ${userId}`);
            return await Card.create({
              id,
              name,
              imageUrl,
              expansion,
              isCollected,
              dateCollected: isCollected ? new Date() : null,
              userId
            });
          }
        }
      } catch (error) {
        console.error(`Error updating card ${id}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(result => result !== null).length;
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated ${successfulUpdates} of ${updates.length} cards for user ${userId}` 
    });
  } catch (error) {
    console.error('Error updating cards:', error);
    return NextResponse.json({ error: 'Failed to update cards' }, { status: 500 });
  }
}

// GET /api/cards - Ottiene tutte le carte raccolte
export async function GET() {
  try {
    // Verifica l'autenticazione dell'utente
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Autenticazione richiesta' }, { status: 401 });
    }
    
    // ID utente dalla sessione
    const userId = session.user.id;
    
    await connectToDatabase();
    
    // Trova tutte le carte raccolte da questo utente
    const collectedCards = await Card.find({ 
      userId: userId,
      isCollected: true 
    });
    
    console.log(`Found ${collectedCards.length} collected cards for user ${userId}`);
    
    return NextResponse.json(collectedCards);
  } catch (error) {
    console.error('Error fetching collected cards:', error);
    return NextResponse.json({ error: 'Failed to fetch collected cards' }, { status: 500 });
  }
}