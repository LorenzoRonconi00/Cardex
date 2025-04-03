// app/api/cards/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase, { Card, WishlistItem } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Ricerca globale di carte in tutte le espansioni
export async function GET(request: NextRequest) {
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

    const searchQuery = request.nextUrl.searchParams.get('q') || '';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '30');
    const expansionFilter = request.nextUrl.searchParams.get('expansion') || '';

    console.log("API Search: Query:", searchQuery, "Limit:", limit, "Expansion Filter:", expansionFilter);

    await connectToDatabase();

    // Debug: verifica delle espansioni disponibili
    const connection = await connectToDatabase();
    // Assicurati che db non sia undefined
    if (!connection || !connection.connection || !connection.connection.db) {
      throw new Error("Impossibile connettersi al database");
    }

    const db = connection.connection.db;
    const cardsCollection = db.collection('cards');

    // Conta le carte per espansione per il debug
    const expansionStats = await cardsCollection.aggregate([
      { $group: { _id: "$expansion", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log("API Search: Espansioni disponibili nel database:");
    expansionStats.forEach(exp => {
      console.log(`   - ${exp._id}: ${exp.count} carte`);
    });

    // 1. Trova le carte già collezionate dall'utente corrente
    const collectedCardIds = await Card.find({ isCollected: true, userId }, 'id')
      .lean()
      .then(cards => cards.map(card => card.id));

    // 2. Trova le carte già nella wishlist dell'utente corrente
    const wishlistCardIds = await WishlistItem.find({ userId }, 'card.id')
      .lean()
      .then(items => items.map(item => item.card.id));

    console.log("API Search: Found", collectedCardIds.length, "collected cards to exclude for user", userId);
    console.log("API Search: Found", wishlistCardIds.length, "wishlist items to exclude for user", userId);

    // Combina tutti gli ID da escludere
    const excludedCardIds = [...collectedCardIds, ...wishlistCardIds];

    const allExpansions = await Card.distinct('expansion');
    console.log("API Search: Available expansions in the database:", allExpansions);

    // Costruisci la query di ricerca
    let searchFilter: any = {};

    // Aggiungi il filtro per escludere le carte già collezionate o nella wishlist
    searchFilter.id = { $nin: excludedCardIds };

    // Aggiungi filtro per nome se specificato
    if (searchQuery) {
      searchFilter.name = { $regex: searchQuery, $options: 'i' };
    }

    // Aggiungi filtro per espansione se specificato
    if (expansionFilter) {
      searchFilter.expansion = expansionFilter;
    }

    console.log("API Search: Query filter:", JSON.stringify(searchFilter));

    // Esegui la ricerca
    const searchResults = await Card.find(searchFilter)
      .sort({ _id: -1 }) // Ordine inverso di inserimento (approssimazione per "più recenti")
      .limit(limit)
      .lean();

    // Rimuovi i duplicati basati sull'ID della carta
    const uniqueResults = [];
    const seenIds = new Set();

    for (const card of searchResults) {
      if (!seenIds.has(card.id)) {
        seenIds.add(card.id);
        uniqueResults.push(card);
      } else {
        console.log(`API Search: Found duplicate card with id ${card.id}, removing duplicate`);
      }
    }

    // Conta i risultati per espansione per il debug
    const resultsByExpansion: Record<string, number> = {};

    uniqueResults.forEach(card => {
      const expansionId = card.expansion as string;
      resultsByExpansion[expansionId] = (resultsByExpansion[expansionId] || 0) + 1;
    });

    console.log("API Search: Results by expansion:");
    Object.entries(resultsByExpansion).forEach(([exp, count]) => {
      console.log(`   - ${exp}: ${count} carte`);
    });

    console.log("API Search: Returning", uniqueResults.length, "unique results");

    return NextResponse.json(uniqueResults, { status: 200 });
  } catch (error) {
    console.error('Error searching cards:', error);
    return NextResponse.json(
      { error: 'Failed to search cards' },
      { status: 500 }
    );
  }
}