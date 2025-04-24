// app/api/cardtrader/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CardTraderService } from '@/services/cardtraderService';
import { Card } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Estrai i dati della carta dalla richiesta
    const card = await request.json() as Card;

    if (!card || !card.name || !card.expansion) {
      return NextResponse.json(
        { error: 'Dati della carta mancanti o incompleti' },
        { status: 400 }
      );
    }

    console.log(`Ricerca su CardTrader: ${card.name} (${card.expansion})`);

    // Ottieni tutti i prodotti corrispondenti
    const allProducts = await CardTraderService.searchCard(card);
    
    // Ottieni direttamente il prodotto con il miglior prezzo
    const bestProduct = await CardTraderService.findBestPrice(card);

    // Stampa informazioni sul prezzo nel terminale
    if (bestProduct) {
      const formattedPrice = (bestProduct.price.cents / 100).toFixed(2);
      const currency = bestProduct.price.currency;
      const condition = bestProduct.properties_hash.condition || 'Near Mint';
      
      console.log('=== CARTA SELEZIONATA ===');
      console.log(`Nome: ${bestProduct.name_en}`);
      console.log(`Espansione: ${bestProduct.expansion.name_en}`);
      console.log(`Prezzo: ${formattedPrice} ${currency}`);
      console.log(`Condizione: ${condition}`);
      console.log(`Venditore: ${bestProduct.user.username} (${bestProduct.user.country_code})`);
      console.log(`ID Prodotto: ${bestProduct.id}`);
      console.log('========================');
    } else {
      console.log(`Nessuna carta trovata per: ${card.name} (${card.expansion})`);
    }

    return NextResponse.json({
      success: true,
      card,
      bestPrice: bestProduct,
      totalFound: allProducts.length,
      totalNearMintHub: allProducts.length  // Tutti i prodotti sono già filtrati per Near Mint e hub
    });
  } catch (error) {
    console.error('Errore nella ricerca della carta su CardTrader:', error);
    return NextResponse.json(
      { error: 'Errore durante la ricerca della carta' },
      { status: 500 }
    );
  }
}