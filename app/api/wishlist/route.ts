// app/api/wishlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase, { WishlistItem } from '@/lib/db';

// GET - Recupera tutti gli elementi della wishlist
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Recupera tutti gli elementi nella wishlist
    const wishlistItems = await WishlistItem.find({})
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
    const { card, price } = await request.json();
    
    if (!card || price === undefined) {
      return NextResponse.json(
        { error: 'Card and price are required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Controlla se la carta è già nella wishlist
    const existingItem = await WishlistItem.findOne({ 'card.id': card.id });
    
    if (existingItem) {
      // Aggiorna il prezzo se la carta esiste già
      await WishlistItem.updateOne(
        { 'card.id': card.id },
        { $set: { price } }
      );
      
      return NextResponse.json(
        { message: 'Wishlist item updated successfully' },
        { status: 200 }
      );
    } else {
      // Inserisci una nuova carta nella wishlist
      const newWishlistItem = new WishlistItem({
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
    return NextResponse.json(
      { error: 'Failed to add card to wishlist' },
      { status: 500 }
    );
  }
}