// app/api/cards/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase, { Card, WishlistItem } from '@/lib/db';

// GET - Ricerca globale di carte in tutte le espansioni
export async function GET(request: NextRequest) {
  try {
    const searchQuery = request.nextUrl.searchParams.get('q') || '';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '30');
    
    await connectToDatabase();
    
    // 1. Trova le carte già collezionate
    const collectedCardIds = await Card.find({ isCollected: true }, 'id')
      .lean()
      .then(cards => cards.map(card => card.id));
    
    // 2. Trova le carte già nella wishlist
    const wishlistCardIds = await WishlistItem.find({}, 'card.id')
      .lean()
      .then(items => items.map(item => item.card.id));
    
    console.log("API Search: Found", collectedCardIds.length, "collected cards to exclude");
    console.log("API Search: Found", wishlistCardIds.length, "wishlist items to exclude");
    
    // Combina tutti gli ID da escludere
    const excludedCardIds = [...collectedCardIds, ...wishlistCardIds];
    
    // Cerchiamo le carte nel database che corrispondono alla query
    let searchResults;
    
    if (searchQuery) {
      // Ricerca con query, escludendo carte già collezionate e nella wishlist
      searchResults = await Card.find({
        name: { $regex: searchQuery, $options: 'i' },
        id: { $nin: excludedCardIds }, // Escludi carte già collezionate o nella wishlist
      })
      .limit(limit)
      .lean();
    } else {
      // Senza query, restituiamo le carte più recenti non collezionate e non nella wishlist
      searchResults = await Card.find({
        id: { $nin: excludedCardIds }, // Escludi carte già collezionate o nella wishlist
      })
      .sort({ _id: -1 }) // Ordine inverso di inserimento (approssimazione per "più recenti")
      .limit(limit)
      .lean();
    }
    
    console.log("API Search: Returning", searchResults.length, "results");
    
    return NextResponse.json(searchResults, { status: 200 });
  } catch (error) {
    console.error('Error searching cards:', error);
    return NextResponse.json(
      { error: 'Failed to search cards' },
      { status: 500 }
    );
  }
}