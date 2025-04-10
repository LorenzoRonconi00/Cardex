import axios from 'axios';
import { PokemonTCGCard, PokemonTCGSet, Card, Expansion } from './types';

const API_BASE_URL = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMON_TCG_API_KEY;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-Api-Key': API_KEY || '',
  },
});

/**
 * Checks if a card is specifically an Illustration Rare
 */
export function isAltArt(card: PokemonTCGCard): boolean {
  // Verifichiamo che la carta abbia esattamente la rarità "Illustration Rare"
  if (card.rarity === 'Illustration Rare') {
    console.log(`Card ${card.id} (${card.name}) is an Illustration Rare`);
    return true;
  }
  return false;
}

/**
 * Fetches expansion sets from the Pokémon TCG API
 */
export async function fetchExpansions(): Promise<Expansion[]> {
  try {
    const response = await api.get('/sets', {
      params: {
        orderBy: '-releaseDate', // Ordina per data di rilascio (più recenti prima)
      }
    });
    
    // Transforming the data to match our Expansion interface
    const expansions: Expansion[] = response.data.data.map((set: PokemonTCGSet) => ({
      id: set.id,
      name: set.name,
      slug: set.id.toLowerCase(),
      logo: set.images.logo,
      releaseDate: set.releaseDate
    }));
    
    // Filtra le espansioni della serie SV e anche quelle recenti che potrebbero non iniziare con "sv"
    // Questa è la modifica principale: ora includiamo anche altre serie recenti
    const recentSeriesIds = ['sv', 'pgo', 'cel', 'swsh', 'sm']; // Aggiungi qui altre serie se necessario
    const recentExpansions = expansions.filter(exp => 
      // Filtra per nome di serie
      recentSeriesIds.some(seriesId => exp.id.toLowerCase().startsWith(seriesId.toLowerCase())) ||
      // O includi specificamente le espansioni che conosci per nome
      ['Journey Together', 'Surging Sparks', 'Stellar Crown', 'Shrouded Fable', 'Paradox Rift'].includes(exp.name)
    );
    
    console.log(`Fetched ${expansions.length} total expansions, filtered to ${recentExpansions.length} recent expansions`);
    
    // Se ci sono espansioni specifiche che ti interessano ma che non vengono catturate dal filtro,
    // puoi loggare l'elenco completo per verificare i loro ID
    if (process.env.NODE_ENV === 'development') {
      console.log("All available expansion sets:");
      expansions.forEach(exp => {
        console.log(`   - ${exp.name} (${exp.id}) - Released: ${exp.releaseDate}`);
      });
    }
    
    // Sort by release date (newest first)
    return recentExpansions.sort((a, b) => 
      new Date(b.releaseDate || '').getTime() - new Date(a.releaseDate || '').getTime()
    );
  } catch (error) {
    console.error('Error fetching expansions:', error);
    throw error;
  }
}

/**
 * Fetches all cards from a specific expansion set
 */
export async function fetchCardsByExpansion(expansionId: string): Promise<Card[]> {
  try {
    console.log(`Fetching cards for expansion ${expansionId}...`);
    
    // First, fetch all cards in the set with the maximum page size
    const response = await api.get('/cards', {
      params: {
        q: `set.id:${expansionId}`,
        orderBy: 'number',
        pageSize: 250, // Maximum allowed by the API
      },
    });
    
    const allCards: PokemonTCGCard[] = response.data.data;
    console.log(`Found ${allCards.length} total cards in set ${expansionId}`);
    
    // Log info about Illustration Rare cards
    const illustrationRareCards = allCards.filter(card => card.rarity === 'Illustration Rare');
    console.log(`Set ${expansionId} has ${illustrationRareCards.length} Illustration Rare cards`);
    
    if (illustrationRareCards.length > 0) {
      console.log(`Example Illustration Rare cards in ${expansionId}:`);
      illustrationRareCards.slice(0, 3).forEach(card => {
        console.log(`  - ${card.name} (${card.id}) - Number: ${card.number}`);
      });
    }
    
    // Filter to only include Illustration Rare cards
    const filteredCards = allCards.filter(isAltArt);
    
    console.log(`Filtered to ${filteredCards.length} Illustration Rare cards in set ${expansionId}`);
    
    if (filteredCards.length === 0) {
      console.log(`No Illustration Rare cards found in set ${expansionId}, checking unique rarities...`);
      const rarities = new Set<string>();
      allCards.forEach(card => {
        if (card.rarity) rarities.add(card.rarity);
      });
      console.log(`Unique rarities in set ${expansionId}:`, Array.from(rarities));
    }
    
    // Transform to our Card interface
    return filteredCards.map((card: PokemonTCGCard) => {
      // Assicuriamoci che l'URL dell'immagine non contenga "_hires"
      let imageUrl = card.images.large;
      if (imageUrl.includes('_hires')) {
        // Rimuovi il suffisso "_hires" dall'URL
        imageUrl = imageUrl.replace('_hires', '');
      }
      
      return {
        id: card.id,
        name: card.name,
        imageUrl: imageUrl,
        expansion: card.set.id,
        isCollected: false // Default value, will be updated from DB
      };
    });
  } catch (error) {
    console.error(`Error fetching cards for expansion ${expansionId}:`, error);
    throw error;
  }
}

/**
 * Fetches a specific card by ID
 */
export async function fetchCardById(cardId: string): Promise<Card | null> {
  try {
    const response = await api.get(`/cards/${cardId}`);
    const card = response.data.data;
    
    return {
      id: card.id,
      name: card.name,
      imageUrl: card.images.large,
      expansion: card.set.id,
      isCollected: false // Default value, will be updated from DB
    };
  } catch (error) {
    console.error(`Error fetching card ${cardId}:`, error);
    return null;
  }
}

/**
 * Get the 13 most recent expansions with Alt Art cards
 */
export async function getRecentExpansionsWithAltArt(_limit = 13): Promise<Expansion[]> {
  try {
    // Non utilizziamo più questa funzione nella nuova logica
    // Torna una lista vuota
    return [];
  } catch (error) {
    console.error('Error getting recent expansions with Alt Art:', error);
    throw error;
  }
}