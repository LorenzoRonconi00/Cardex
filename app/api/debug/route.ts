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

// Interfaccia per la struttura delle carte
interface PokemonCard {
  id: string;
  name: string;
  number: string;
  rarity: string | undefined;
  subtypes: string[] | undefined;
  supertype: string;
  types: string[] | undefined;
  images: {
    small: string;
    large: string;
  };
  nationalPokedexNumbers?: number[];
  artist?: string;
}

// Interfaccia per l'analisi delle carte
interface CardAnalysis {
  id: string;
  name: string;
  number: string;
  rarity: string | undefined;
  subtypes: string[];
  supertype: string;
  types: string[];
  imageUrl: string;
  nationalPokedexNumbers?: number[];
  artist?: string;
  hasAltArtInSubtypes: boolean;
  hasAltArtInRarity: boolean;
}

// Interfaccia per le informazioni di debug
interface DebugInfo {
  [setId: string]: {
    totalCards: number;
    uniqueRarities: string[];
    uniqueSubtypes: string[];
    sampleCards: CardAnalysis[];
  };
}

// GET /api/debug
export async function GET() {
  try {
    // Definiamo alcuni set che sappiamo contenere Alt Art
    const setIds: string[] = ['sv1', 'sv2', 'sv3', 'sv4', 'swsh12', 'swsh10'];
    const debugInfo: DebugInfo = {};
    
    // Per ogni set, prendiamo alcune carte e analizziamole
    for (const setId of setIds) {
      const response = await api.get('/cards', {
        params: {
          q: `set.id:${setId}`,
          orderBy: 'number',
          pageSize: 20, // Prendiamo solo 20 carte per set per non sovraccaricare
        },
      });
      
      const cards: PokemonCard[] = response.data.data;
      
      // Analizziamo le proprietà di ogni carta
      const cardsAnalysis: CardAnalysis[] = cards.map((card: PokemonCard) => ({
        id: card.id,
        name: card.name,
        number: card.number,
        rarity: card.rarity,
        subtypes: card.subtypes || [],
        supertype: card.supertype,
        types: card.types || [],
        imageUrl: card.images.small,
        // Altri campi potenzialmente utili
        nationalPokedexNumbers: card.nationalPokedexNumbers,
        artist: card.artist,
        // Analizziamo anche i valori unici presenti nei field chiave
        hasAltArtInSubtypes: card.subtypes ? card.subtypes.some(s => 
          s.toLowerCase().includes('alt') || 
          s.toLowerCase().includes('special') || 
          s.toLowerCase().includes('illustration')
        ) : false,
        hasAltArtInRarity: card.rarity ? (
          card.rarity.toLowerCase().includes('alt') || 
          card.rarity.toLowerCase().includes('special') || 
          card.rarity.toLowerCase().includes('illustration') ||
          card.rarity.toLowerCase().includes('secret') ||
          card.rarity.toLowerCase().includes('ultra')
        ) : false
      }));
      
      // Estrai valori unici dai campi chiave
      const allRarities: string[] = [];
      const allSubtypes: string[] = [];
      
      // Metodo sicuro per estrarre rarità uniche
      cards.forEach(card => {
        if (card.rarity) {
          if (!allRarities.includes(card.rarity)) {
            allRarities.push(card.rarity);
          }
        }
        
        if (card.subtypes && Array.isArray(card.subtypes)) {
          card.subtypes.forEach(subtype => {
            if (!allSubtypes.includes(subtype)) {
              allSubtypes.push(subtype);
            }
          });
        }
      });
      
      debugInfo[setId] = {
        totalCards: cards.length,
        uniqueRarities: allRarities,
        uniqueSubtypes: allSubtypes,
        sampleCards: cardsAnalysis,
      };
    }
    
    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ error: 'Failed to fetch debug info' }, { status: 500 });
  }
}