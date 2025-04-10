import { NextResponse } from 'next/server';
import axios from 'axios';

// Configurazione API Pokémon TCG
const API_BASE_URL = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMON_TCG_API_KEY;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-Api-Key': API_KEY || '',
  },
});

interface PokemonCard {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  images: {
    small: string;
  };
}

interface RarityStats {
  [key: string]: {
    count: number;
    examples: Array<{
      id: string;
      name: string;
      number: string;
      image: string;
    }>;
  };
}

// GET /api/debug-rarities/[expansionId]
export async function GET(
  request: Request,
  context: { params: { expansionId: string } }
) {
  try {
    const expansionId = context.params.expansionId;
    
    if (!expansionId) {
      return NextResponse.json({ error: 'Expansion ID is required' }, { status: 400 });
    }
    
    // Fetch all cards in the set
    const response = await api.get('/cards', {
      params: {
        q: `set.id:${expansionId}`,
        orderBy: 'number',
        pageSize: 250, // Maximum allowed by the API
      },
    });
    
    const allCards = response.data.data;
    
    // Analyze rarities
    const rarityStats: RarityStats = {};
    const rarities = new Set<string>();
    
    // Collect all unique rarities
    allCards.forEach((card: PokemonCard) => {
      if (card.rarity) rarities.add(card.rarity);
    });
    
    // For each rarity, analyze cards
    Array.from(rarities).forEach((rarity: string) => {
      const cardsWithRarity = allCards.filter((card: PokemonCard) => card.rarity === rarity);
      
      rarityStats[rarity] = {
        count: cardsWithRarity.length,
        examples: cardsWithRarity.slice(0, 5).map((card: PokemonCard) => ({
          id: card.id,
          name: card.name,
          number: card.number,
          image: card.images.small
        }))
      };
    });
    
    return NextResponse.json({
      expansionId,
      totalCards: allCards.length,
      rarities: Array.from(rarities),
      rarityStats
    });
  } catch (error) {
    console.error(`Error analyzing rarities for expansion:`, error);
    return NextResponse.json({ error: 'Failed to analyze rarities' }, { status: 500 });
  }
}