// app/api/wishlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase, { WishlistItem } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface MongoDBError extends Error {
  code?: number;
}

// GET - Recupera tutti gli elementi della wishlist
export async function GET() {
  try {
    // Verifica che l'utente sia autenticato
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Ottieni l'ID dell'utente
    const userId = session.user.id;
    
    await connectToDatabase();
    
    // Recupera solo gli elementi nella wishlist dell'utente corrente
    const wishlistItems = await WishlistItem.find({ userId })
      .sort({ price: 1 }) // Ordina per prezzo crescente
      .lean();
    
    // Assicurati che ogni documento abbia sia _id che id nel formato corretto
    const processedItems = wishlistItems.map(item => {
      // Usa Object.assign per creare un nuovo oggetto con le proprietà trasformate
      return {
        ...item,
        _id: item._id ? item._id.toString() : undefined,
        id: item._id ? item._id.toString() : undefined
      };
    });
    
    return NextResponse.json(processedItems, { status: 200 });
  } catch (error) {
    console.error('Error fetching wishlist items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist items' },
      { status: 500 }
    );
  }
}

// POST - Aggiungi una carta alla wishlist
export async function POST(request: NextRequest) {
  try {
    // Verifica che l'utente sia autenticato
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Ottieni l'ID dell'utente
    const userId = session.user.id;
    
    const { card, price } = await request.json();
    
    if (!card || price === undefined) {
      return NextResponse.json(
        { error: 'Card and price are required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Controlla se la carta è già nella wishlist dell'utente
    const existingItem = await WishlistItem.findOne({ 
      userId, 
      'card.id': card.id 
    });
    
    if (existingItem) {
      // Aggiorna il prezzo se la carta esiste già
      await WishlistItem.updateOne(
        { userId, 'card.id': card.id },
        { $set: { price } }
      );
      
      return NextResponse.json(
        { message: 'Wishlist item updated successfully' },
        { status: 200 }
      );
    } else {
      // Inserisci una nuova carta nella wishlist dell'utente
      const newWishlistItem = new WishlistItem({
        userId,
        card,
        price,
        dateAdded: new Date()
      });
      
      const savedItem = await newWishlistItem.save();
      
      return NextResponse.json(
        { 
          message: 'Card added to wishlist successfully',
          id: savedItem._id.toString() 
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error adding card to wishlist:', error);
    
    // Gestione specifica per errori di duplicazione (carta già esistente)
    if (error instanceof Error && (error as MongoDBError).code === 11000) {
      return NextResponse.json(
        { error: 'This card is already in your wishlist' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add card to wishlist' },
      { status: 500 }
    );
  }
}